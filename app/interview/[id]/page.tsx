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
import { Mic, MicOff, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interview_id = params.id as string;

  const [interview, setInterview] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
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
        
        // If interview is completed, redirect to report
        if (data.interview.status === 'completed') {
          router.push(`/interview/${interview_id}/report`);
        }
        
        // If interview is paused, show notification
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
        // Check if interview is completed
        if (data.completed) {
          // Generate final report and redirect
          await generateFinalReport();
          return;
        }
        setCurrentQuestion(data.question);
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
        
        // Check size
        const sizeMB = audioBlob.size / 1024 / 1024;
        if (sizeMB > 15) {
          setError('Recording exceeds 15MB. Please record again with a shorter answer.');
          setAudioBlob(null);
        } else {
          setAudioBlob(audioBlob);
          // Automatically transcribe after recording stops
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
        // Append transcription to existing answer instead of replacing
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

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    await transcribeRecording(audioBlob);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Evaluate answer with question start time
      const evalResponse = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interview_id, 
          answer_text: answer,
          question_started_at: questionStartTime?.toISOString()
        }),
      });

      const evalData = await evalResponse.json();
      
      if (!evalResponse.ok) {
        throw new Error(evalData.message);
      }

      // Generate feedback (stored but not shown)
      await fetch('/api/interview/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interview_id, 
          question_number: evalData.question_number 
        }),
      });

      // Show success toast
      toast.success('Answer submitted successfully!');

      // Reload interview state and move to next question
      await loadInterview();
      
      // Automatically get next question
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
      {/* Interview Header - No navigation */}
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Question Card */}
          {currentQuestion ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{currentQuestion.category}</Badge>
                      <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
                      {questionStartTime && <QuestionTimer startTime={questionStartTime} />}
                    </div>
                    {currentQuestion.intro && (
                      <CardDescription className="mb-4">{currentQuestion.intro}</CardDescription>
                    )}
                    <CardTitle className="text-2xl leading-relaxed">
                      {currentQuestion.question}
                    </CardTitle>
                  </div>
                  <QuestionBookmark
                    interviewId={interview_id}
                    questionNumber={interview.current_question_number + 1}
                    question={currentQuestion.question}
                    answer={answer}
                    isBookmarked={bookmarkedQuestions.includes(interview.current_question_number + 1)}
                    onToggle={() => {
                      const questionNum = interview.current_question_number + 1;
                      setBookmarkedQuestions(prev =>
                        prev.includes(questionNum)
                          ? prev.filter(n => n !== questionNum)
                          : [...prev, questionNum]
                      );
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Your Answer
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full min-h-[200px] px-4 py-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Type your answer here or use voice recording..."
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      type="button"
                      onClick={startRecording}
                      variant="outline"
                      disabled={loading}
                      className="flex-1"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Record Answer
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex-1"
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>

                <Separator />

                <Button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Answer & Continue'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
                <p className="text-muted-foreground mb-6">
                  Click below to get your {interview.current_question_number === 0 ? 'first' : 'next'} question.
                </p>
                <Button
                  onClick={getNextQuestion}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Generating Question...' : `Get ${interview.current_question_number === 0 ? 'First' : 'Next'} Question`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress Summary */}
          {interview.qa_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress Summary</CardTitle>
                <CardDescription>
                  {interview.qa_history.length} question(s) answered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {interview.qa_history.slice(-5).reverse().map((qa: any) => (
                    <div key={qa.question_number} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Question {qa.question_number}</div>
                          <div className="text-sm text-muted-foreground">{qa.question.skill}</div>
                        </div>
                      </div>
                      <Badge variant="outline">{qa.question.category}</Badge>
                    </div>
                  ))}
                  {interview.qa_history.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {interview.qa_history.length - 5} more...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
