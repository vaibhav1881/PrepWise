'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InterviewTimer, QuestionTimer, QuestionBookmark } from '@/components/interview/timer';
import { Mic, MicOff, Send, CheckCircle2, AlertCircle, Code2, Play, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interview_id = params.id as string;

  const [interview, setInterview] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  // Input State
  const [activeTab, setActiveTab] = useState<'text' | 'code'>('text');
  const [answer, setAnswer] = useState('');

  // Code State
  const [code, setCode] = useState('// Write your solution here\nconsole.log("Hello World");\n');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const runButtonRef = useRef<HTMLButtonElement>(null);

  const STARTER_CODE: Record<string, string> = {
    javascript: `// Write your solution here\nconsole.log("Hello World");\n`,
    python: `# Write your solution here\nprint("Hello World")\n`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}\n`,
    cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}\n`,
    go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}\n`
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Only reset code if it looks like the default or is empty, to prevent losing user work
    if (!code.trim() || Object.values(STARTER_CODE).some(c => code.includes(c.trim()) || c.includes(code.trim()))) {
      setCode(STARTER_CODE[newLang] || '');
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runButtonRef.current?.click();
    });
  };

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadInterview();
  }, [interview_id]);

  const loadInterview = async () => {
    try {
      const response = await fetch(`/api/interview/get?interview_id=${interview_id}`);
      const data = await response.json();

      if (response.ok) {
        setInterview(data.interview);
        setBookmarkedQuestions(data.interview.bookmarked_questions?.map((b: any) => b.question_number) || []);

        if (data.interview.status === 'completed') {
          router.push(`/interview/${interview_id}/report`);
        }

        if (data.interview.status === 'paused') {
          toast.info('Interview is paused. Resume to continue.');
        }
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError('Failed to load interview');
    }
  };

  const getNextQuestion = async () => {
    setLoading(true);
    setError('');
    setCurrentQuestion(null);
    setAnswer('');
    setCode('// Write your solution here\n');
    setOutput('');
    setAudioBlob(null);
    setQuestionStartTime(new Date());

    try {
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.completed) {
          await generateFinalReport();
          return;
        }
        setCurrentQuestion(data.question);
        // Default to code tab if question style is coding
        const style = data.question.question_style;
        if (style === 'coding') {
          setActiveTab('code');
        } else {
          // For theory or fallback, use text tab
          setActiveTab('text');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to generate question');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        const sizeMB = audioBlob.size / 1024 / 1024;
        if (sizeMB > 15) {
          setError('Recording exceeds 15MB. Please record again with a shorter answer.');
          setAudioBlob(null);
        } else {
          setAudioBlob(audioBlob);
          transcribeRecording(audioBlob);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeRecording = async (blob: Blob) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch('/api/interview/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnswer(prev => prev ? `${prev} ${data.transcript}` : data.transcript);
        setAudioBlob(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;
    setIsExecuting(true);
    setOutput('Running...');

    try {
      // Mock execute for now if API route not ready, or actual call
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code
        })
      });

      const data = await response.json();
      if (data.run) {
        setOutput(data.run.output || 'No output received. (Did you print to console?)');
      } else {
        setOutput(data.message || 'Execution failed');
      }
    } catch (err) {
      setOutput('Error executing code. Please check your connection.');
    } finally {
      setIsExecuting(false);
    }
  };

  const submitAnswer = async () => {
    // Combine Answer based on active tab
    let finalAnswer = answer;

    if (activeTab === 'code') {
      if (!code.trim() || code === '// Write your solution here\n') {
        toast.error('Please write some code');
        return;
      }
      finalAnswer = `[Code Submission - ${language}]\n\n${code}\n\n[Execution Output]\n${output || 'Not run'}\n\n[Explanation]\n${answer}`;
    }

    if (!finalAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const evalResponse = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id,
          answer_text: finalAnswer,
          question_started_at: questionStartTime?.toISOString()
        }),
      });

      const evalData = await evalResponse.json();

      if (!evalResponse.ok) {
        throw new Error(evalData.message);
      }

      await fetch('/api/interview/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id,
          question_number: evalData.question_number
        }),
      });

      toast.success('Answer submitted successfully!');
      await loadInterview();
      await getNextQuestion();
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    await generateFinalReport();
  };

  const generateFinalReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/interview/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id }),
      });

      if (response.ok) {
        router.push(`/interview/${interview_id}/report`);
      } else {
        setError('Failed to generate report');
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-lg">{error}</AlertDescription>
          <Button variant="outline" className="mt-4 w-full" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </Alert>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  const progress = (interview.current_question_number / (interview.role_block.total_questions || 5)) * 100;

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">{interview.role_block.role_name}</h1>
              <p className="text-sm text-muted-foreground">
                Question {interview.current_question_number + 1} of {interview.role_block.total_questions || 5}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {interview.started_at && (
              <InterviewTimer
                interviewId={interview_id}
                startTime={interview.started_at}
                pausedAt={interview.paused_at}
                pauseDuration={interview.pause_duration_seconds || 0}
              />
            )}
            <Button variant="outline" onClick={finishInterview} size="sm">
              Finish Early
            </Button>
          </div>
        </div>
        <div className="container">
          <Progress value={progress} className="h-1" />
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentQuestion ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
              {/* Left Side: Question Pane */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize">{currentQuestion.category}</Badge>
                    {currentQuestion.question_style && (
                      <Badge variant="secondary" className="capitalize bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">
                        {currentQuestion.question_style}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="capitalize">{currentQuestion.difficulty}</Badge>
                    {questionStartTime && <QuestionTimer startTime={questionStartTime} />}
                  </div>
                  {currentQuestion.intro && (
                    <CardDescription className="mb-4">{currentQuestion.intro}</CardDescription>
                  )}
                  <CardTitle className="text-xl leading-relaxed">
                    {currentQuestion.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <div className="text-muted-foreground text-sm space-y-4">
                    <p>Consider:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Time complexity constraints</li>
                      <li>Edge cases (empty inputs, nulls)</li>
                      <li>Clean code practices</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Right Side: Answer Pane */}
              <Card className="h-full flex flex-col border-0 shadow-none lg:border lg:shadow-sm bg-transparent lg:bg-card">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'code')} className="flex-1 flex flex-col h-full">
                  <div className="px-6 pt-4 border-b bg-muted/20">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text" className="flex items-center gap-2">
                        <Mic className="h-4 w-4" /> Text / Voice
                      </TabsTrigger>
                      <TabsTrigger value="code" className="flex items-center gap-2">
                        <Code2 className="h-4 w-4" /> Code Playground
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 p-0 relative flex flex-col min-h-0">
                    {/* Text Input Tab */}
                    <TabsContent value="text" className="h-full m-0 p-4 space-y-4 flex flex-col data-[state=active]:flex min-h-0">
                      <div className="flex-1 relative flex flex-col min-h-0">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          className="w-full flex-1 p-4 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring font-sans text-base leading-relaxed"
                          placeholder="Type your answer here or use voice recording..."
                          disabled={loading}
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          {!isRecording ? (
                            <Button
                              type="button"
                              onClick={startRecording}
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                            >
                              <Mic className="h-4 w-4 mr-2" /> Record
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={stopRecording}
                              variant="destructive"
                              size="sm"
                            >
                              <MicOff className="h-4 w-4 mr-2" /> Stop
                            </Button>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Code Input Tab */}
                    <TabsContent value="code" className="h-full m-0 flex flex-col data-[state=active]:flex overflow-hidden">
                      <div className="p-2 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-500 flex items-center justify-center gap-2 shrink-0">
                        <AlertCircle className="h-3 w-3" />
                        <span>Sandbox Environment: Standard libraries only. Mock external packages (e.g. express, react) to demonstrate logic.</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border-b bg-muted/10 shrink-0">
                        <Select value={language} onValueChange={handleLanguageChange}>
                          <SelectTrigger className="w-[180px] h-8">
                            <Code2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="go">Go</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <div className="hidden md:flex items-center text-xs text-muted-foreground mr-2">
                            <span className="bg-muted px-1.5 py-0.5 rounded border text-[10px] mac-cmd">Ctrl+Enter</span>
                            <span className="ml-1">to run</span>
                          </div>
                          <Button
                            ref={runButtonRef}
                            size="sm"
                            onClick={handleRunCode}
                            disabled={isExecuting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isExecuting ? (
                              <span className="animate-pulse">Running...</span>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-2" /> Run Code
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[300px] relative border-b">
                        <Editor
                          height="100%"
                          language={language}
                          theme="vs-dark"
                          value={code}
                          onChange={(value) => setCode(value || '')}
                          onMount={handleEditorDidMount}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 },
                          }}
                        />
                      </div>

                      <div className="h-[200px] shrink-0 bg-zinc-950 text-zinc-100 p-4 font-mono text-sm overflow-auto border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-2 sticky top-0 bg-zinc-950 pb-2 border-b border-zinc-900">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                            <Terminal className="h-3 w-3" /> Console Output
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] text-zinc-500 hover:text-zinc-300 px-2"
                            onClick={() => setOutput('')}
                          >
                            Clear
                          </Button>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-xs">{output || 'Hit "Run Code" to see output...'}</pre>
                      </div>
                    </TabsContent>
                  </div>

                  <div className="p-4 border-t bg-background shrink-0">
                    <Button
                      onClick={submitAnswer}
                      disabled={loading}
                      className="w-full h-12 text-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Evaluating...' : 'Submit Solution'}
                    </Button>
                  </div>
                </Tabs>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready for Question {interview.current_question_number + 1}?</h2>
                <Button onClick={getNextQuestion} disabled={loading} size="lg">
                  {loading ? 'Generating...' : 'Start Question'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress Summary (Hidden on mobile to save space, improved layout) */}
          <div className="hidden lg:block">
            {/* Simple footer stats */}
            <div className="flex justify-between text-sm text-muted-foreground pt-4 border-t">
              <span>Session ID: {interview_id.slice(-6)}</span>
              <span>{interview.role_block.role_name}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
