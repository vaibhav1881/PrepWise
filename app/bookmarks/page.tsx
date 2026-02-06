'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, FileText } from 'lucide-react';

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    loadBookmarks();
  }, [router]);

  const loadBookmarks = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const response = await fetch(`/api/interview/list?user_id=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        // Extract all bookmarks from all interviews
        const allBookmarks: any[] = [];
        data.interviews.forEach((interview: any) => {
          if (interview.bookmarked_questions && interview.bookmarked_questions.length > 0) {
            interview.bookmarked_questions.forEach((bookmark: any) => {
              allBookmarks.push({
                ...bookmark,
                interview_id: interview._id,
                role_name: interview.role_block.role_name,
                interview_date: interview.created_at,
              });
            });
          }
        });
        
        // Sort by most recent
        allBookmarks.sort((a, b) => 
          new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
        );
        
        setBookmarks(allBookmarks);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl mx-auto py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Bookmarked Questions</h1>
            <p className="text-muted-foreground mt-2">
              Review questions you've bookmarked during interviews
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                <p className="text-muted-foreground mb-4">Bookmark questions during interviews to review them later</p>
                <Button onClick={() => router.push('/interview/start')}>
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Q{bookmark.question_number}</Badge>
                          <Badge variant="secondary">{bookmark.role_name}</Badge>
                        </div>
                        <CardTitle className="text-xl leading-relaxed">
                          {bookmark.question}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Bookmarked on {formatDate(bookmark.bookmarked_at)}
                        </CardDescription>
                      </div>
                      <Bookmark className="h-5 w-5 text-primary fill-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bookmark.answer && (
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-semibold mb-2">Your Answer:</div>
                        <div className="text-sm">{bookmark.answer}</div>
                      </div>
                    )}
                    
                    {bookmark.note && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">Note:</div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">{bookmark.note}</div>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/interview/${bookmark.interview_id}/report`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Interview Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
