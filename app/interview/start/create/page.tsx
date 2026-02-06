'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import Link from 'next/link';
import { InterviewType } from '@/lib/interview-types';

export default function CreateRolePage() {
  const router = useRouter();
  const [jobText, setJobText] = useState('');
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>(['technical']);
  const [customType, setCustomType] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [saveRole, setSaveRole] = useState(true);
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeToggle = (type: InterviewType) => {
    if (interviewTypes.includes(type)) {
      setInterviewTypes(interviewTypes.filter(t => t !== type));
    } else {
      setInterviewTypes([...interviewTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

    if (saveRole && !roleTitle.trim()) {
      setError('Please provide a title for this role');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
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
      if (!roleResponse.ok) {
        throw new Error(roleData.message || 'Failed to generate role');
      }

      const startResponse = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          role_block_id: roleData.role_block_id 
        }),
      });

      const startData = await startResponse.json();
      if (!startResponse.ok) {
        throw new Error(startData.message || 'Failed to start interview');
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
            <h1 className="text-3xl font-bold mb-2">Create New Interview Role</h1>
            <p className="text-muted-foreground mb-8">
              Define your interview parameters and optionally save for future use
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-700">
                  {error}
                </div>
              )}

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
                    <label className="block text-sm font-medium mb-2">
                      Role Title *
                    </label>
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
                    <label className="block text-sm font-medium mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground"
                      rows={2}
                      placeholder="Brief description of this interview role..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Visibility
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          visibility === 'public'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        {visibility === 'public' && '✓ '}
                        🌐 Public
                        <div className="text-xs mt-1 font-normal opacity-80">
                          Anyone can find and use this role
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility('private')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          visibility === 'private'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        {visibility === 'private' && '✓ '}
                        🔒 Private
                        <div className="text-xs mt-1 font-normal opacity-80">
                          Only you can see and use this role
                        </div>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      You can change this later from the role selection page
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Role / Description
                </label>
                <textarea
                  required
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground"
                  rows={6}
                  placeholder="E.g., Senior Full-Stack Developer with expertise in React, Node.js, and MongoDB. Should have experience in building scalable applications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Interview Type(s) <span className="text-muted-foreground">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['technical', 'hr', 'behavioral', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeToggle(type)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        interviewTypes.includes(type)
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
                      placeholder="Specify custom interview type (e.g., Case Study, System Design)"
                    />
                  </div>
                )}
                
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {interviewTypes.length > 0 
                    ? interviewTypes.map(t => t === 'other' && customType ? customType : t).join(', ')
                    : 'None'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Questions
                </label>
                
                <div className="flex gap-2 mb-3">
                  {[1, 5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        questionCount === count
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
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Quick (1-20)</span>
                  <span>Moderate (30-50)</span>
                  <span>Comprehensive (100)</span>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ul className="text-sm space-y-1">
                  <li>✓ AI generates adaptive questions based on your role</li>
                  <li>✓ Answer via text or voice</li>
                  <li>✓ Questions adapt based on your answers</li>
                  <li>✓ Get comprehensive feedback in final report</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-base"
              >
                {loading ? 'Preparing Interview...' : saveRole ? 'Save Role & Start Interview' : 'Start Interview'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
