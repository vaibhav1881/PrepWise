'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show this if user is logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-8 px-4">
          <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl border dark:border-gray-700">
            <h1 className="text-4xl font-bold mb-4">
              Welcome back, {user.name || user.email}! 👋
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              You're successfully logged in
            </p>

            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 mb-6">
              <h2 className="font-semibold text-lg mb-3">Your Account</h2>
              <div className="space-y-2 text-left">
                <p className="text-foreground">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p className="text-foreground">
                  <span className="font-medium">User ID:</span> {user.id}
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show this if user is NOT logged in
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 px-4">
        <div>
          <h1 className="text-5xl font-bold mb-4">
            Welcome to <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">PrepWise</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Master your interview skills with AI-powered practice sessions. Get real-time feedback, personalized questions, and comprehensive performance reports.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Sign Up
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Log In
            </Button>
          </Link>
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto border dark:border-gray-700">
          <h2 className="font-semibold text-lg mb-3">Why PrepWise?</h2>
          <ul className="text-left space-y-2">
            <li>🤖 AI-Powered Question Generation</li>
            <li>📊 Real-time Answer Evaluation (0-10 Scoring)</li>
            <li>📈 Comprehensive Performance Reports</li>
            <li>🎯 Custom Interview Roles & Topics</li>
            <li>🔖 Bookmark Important Questions</li>
            <li>📝 Export Results as PDF or Text</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
