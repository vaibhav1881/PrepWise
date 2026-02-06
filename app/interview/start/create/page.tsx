'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import Link from 'next/link';
import { InterviewType } from '@/lib/interview-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Briefcase, User } from 'lucide-react';

export default function CreateRolePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'resume'>('manual');

  // Manual Mode State
  const [jobText, setJobText] = useState('');
  const [saveRole, setSaveRole] = useState(true);
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Resume Mode State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeRole, setResumeRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('Junior (1-3 years)');

  // Shared State
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>(['technical']);
  const [customType, setCustomType] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeToggle = (type: InterviewType) => {
    if (interviewTypes.includes(type)) {
      setInterviewTypes(interviewTypes.filter(t => t !== type));
    } else {
      setInterviewTypes([...interviewTypes, type]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (interviewTypes.length === 0) {
      setError('Please select at least one interview type');
      setLoading(false);
      return;
    }

    if (interviewTypes.includes('other') && !customType.trim()) {
      setError('Please specify the custom interview type');
      setLoading(false);
      return;
    }

    if (activeTab === 'manual') {
      if (!jobText.trim()) {
        setError('Please enter a job description');
        setLoading(false);
        return;
      }
      if (saveRole && !roleTitle.trim()) {
        setError('Please provide a title for this role');
        setLoading(false);
        return;
      }
    } else {
      if (!resumeFile) {
        setError('Please upload a resume (PDF)');
        setLoading(false);
        return;
      }
      if (!resumeRole.trim()) {
        setError('Please enter the target role');
        setLoading(false);
        return;
      }
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let startData;

      if (activeTab === 'manual') {
        const roleResponse = await fetch('/api/interview/generate-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_text: jobText,
            interview_types: interviewTypes,
            custom_type: interviewTypes.includes('other') ? customType : undefined,
            question_count: questionCount,
            save_role: saveRole,
            role_title: saveRole ? roleTitle : undefined,
            role_description: saveRole ? roleDescription : undefined,
            visibility: saveRole ? visibility : undefined,
            user_id: user.id,
          }),
        });

        const roleData = await roleResponse.json();
        if (!roleResponse.ok) throw new Error(roleData.message || 'Failed to generate role');

        const startResponse = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            role_block_id: roleData.role_block_id
          }),
        });

        startData = await startResponse.json();
        if (!startResponse.ok) throw new Error(startData.message || 'Failed to start interview');

      } else {
        // Resume Mode
        const formData = new FormData();
        formData.append('resume', resumeFile!);
        formData.append('role', resumeRole);
        formData.append('experience_level', experienceLevel);
        formData.append('interview_types', JSON.stringify(interviewTypes));
        formData.append('question_count', questionCount.toString());
        formData.append('user_id', user.id);

        const generateResponse = await fetch('/api/interview/generate-role-from-resume', {
          method: 'POST',
          body: formData,
        });

        const generateData = await generateResponse.json();
        if (!generateResponse.ok) throw new Error(generateData.message || 'Failed to analyze resume');

        const startResponse = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            role_block_id: generateData.role_block_id
          }),
        });

        startData = await startResponse.json();
        if (!startResponse.ok) throw new Error(startData.message || 'Failed to start interview');
      }

      router.push(`/interview/${startData.interview_id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <main className="flex-1 overflow-auto bg-background">
        <div className="container max-w-3xl mx-auto py-6 space-y-6">
          <div className="mb-4">
            <Link href="/interview/start" className="text-primary hover:underline">
              ← Back to Role Selection
            </Link>
          </div>

          <div className="bg-card rounded-2xl shadow-xl p-8 border">
            <h1 className="text-3xl font-bold mb-2">Create New Interview</h1>
            <p className="text-muted-foreground mb-8">
              Customize your interview session
            </p>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'resume')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Role Description
                </TabsTrigger>
                <TabsTrigger value="resume" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resume Upload
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-700">
                    {error}
                  </div>
                )}

                <TabsContent value="manual" className="space-y-6">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveRole}
                        onChange={(e) => setSaveRole(e.target.checked)}
                        className="w-5 h-5 text-primary focus:ring-primary rounded"
                      />
                      <span className="ml-3 text-sm font-medium">
                        Save this role for future use
                      </span>
                    </label>
                  </div>

                  {saveRole && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Role Title *</label>
                        <input
                          type="text"
                          required={saveRole}
                          value={roleTitle}
                          onChange={(e) => setRoleTitle(e.target.value)}
                          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground placeholder:text-muted-foreground"
                          placeholder="E.g., Senior Full-Stack Developer Interview"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                        <textarea
                          value={roleDescription}
                          onChange={(e) => setRoleDescription(e.target.value)}
                          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground"
                          rows={2}
                          placeholder="Brief description..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3">Visibility</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setVisibility('public')}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${visibility === 'public'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                                : 'border-border bg-card hover:bg-muted'
                              }`}
                          >
                            ✓ 🌐 Public
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisibility('private')}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${visibility === 'private'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'border-border bg-card hover:bg-muted'
                              }`}
                          >
                            ✓ 🔒 Private
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Job Role / Description *</label>
                    <textarea
                      required={activeTab === 'manual'}
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground"
                      rows={6}
                      placeholder="E.g., Senior Full-Stack Developer with expertise in React..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="resume" className="space-y-6">
                  <div className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                          Upload Resume (PDF)
                        </span>
                        <input
                          id="resume-upload"
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                      {resumeFile ? (
                        <p className="text-sm font-medium text-green-600 mt-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> {resumeFile.name}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          Supported format: PDF (Max 5MB)
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Role *</label>
                    <input
                      type="text"
                      required={activeTab === 'resume'}
                      value={resumeRole}
                      onChange={(e) => setResumeRole(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground placeholder:text-muted-foreground"
                      placeholder="E.g., Frontend Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Experience Level *</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground"
                    >
                      <option value="Intern / Fresher (0-1 years)">Intern / Fresher (0-1 years)</option>
                      <option value="Junior (1-3 years)">Junior (1-3 years)</option>
                      <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                      <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                      <option value="Lead / Architect (8+ years)">Lead / Architect (8+ years)</option>
                    </select>
                  </div>
                </TabsContent>

                {/* Shared Section */}
                <div className="pt-6 border-t">
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                      Interview Type(s) <span className="text-muted-foreground">(Select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['technical', 'hr', 'behavioral', 'other'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTypeToggle(type)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${interviewTypes.includes(type)
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-border bg-card hover:bg-muted'
                            }`}
                        >
                          {interviewTypes.includes(type) && '✓ '}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>

                    {interviewTypes.includes('other') && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value)}
                          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground placeholder:text-muted-foreground"
                          placeholder="Specify custom interview type..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Number of Questions</label>
                    <div className="flex gap-2 mb-3">
                      {[1, 5, 10, 15, 20].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setQuestionCount(count)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${questionCount === count
                              ? 'border-primary bg-primary text-primary-foreground font-semibold'
                              : 'border-border bg-card hover:bg-muted'
                            }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                          className="w-20 px-3 py-2 border border-input rounded-lg text-center focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background text-foreground"
                        />
                        <span className="text-sm">questions</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-base"
                  >
                    {loading
                      ? 'Preparing Interview...'
                      : activeTab === 'manual' && saveRole
                        ? 'Save Role & Start Interview'
                        : 'Start Personalized Interview'
                    }
                  </Button>
                </div>
              </form>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
