'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { PlayCircle, History, Award, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    avgScore: 0,
    totalInterviews: 0,
    completedInterviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch interview stats
    fetchStats(parsedUser.id);
  }, [router]);

  const fetchStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/interview/list?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok && data.interviews) {
        const completed = data.interviews.filter((i: any) => i.status === 'completed');
        const scores = completed
          .map((i: any) => i.final_report?.overall_performance)
          .filter((score: any) => score !== undefined && score !== null);
        
        const avgScore = scores.length > 0 
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
          : 0;
        
        setStats({
          avgScore: Math.round(avgScore),
          totalInterviews: data.interviews.length,
          completedInterviews: completed.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 overflow-auto flex items-start justify-center">
        <div className="container max-w-7xl mx-auto py-6 space-y-6">
          {/* Welcome Section */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Welcome back, {user.name || 'User'}!</CardTitle>
                  <CardDescription className="mt-2">
                    Ready to practice and improve your interview skills?
                  </CardDescription>
                </div>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/interview/start')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Start Interview
                </CardTitle>
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">New Practice</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Begin a new AI interview
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/history')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  History
                </CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View Past</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Review your interviews
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Score
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.completedInterviews > 0 ? `${stats.avgScore}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedInterviews > 0 
                    ? `From ${stats.completedInterviews} interview${stats.completedInterviews > 1 ? 's' : ''}`
                    : 'Complete an interview first'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Interviews
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalInterviews}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedInterviews} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Interview Feature Card */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Interview Practice
              </CardTitle>
              <CardDescription>
                Practice interviews with our AI-powered system and get comprehensive feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Adaptive questions based on your performance
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Voice or text answer support
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Multiple interview types (Technical, HR, Behavioral)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Detailed performance analysis and feedback
                </div>
              </div>
              <Button 
                onClick={() => router.push('/interview/start')}
                className="w-full"
                size="lg"
              >
                Start AI Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
