'use client';

import { useEffect, useState } from 'react';
import { Timer, Pause, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface InterviewTimerProps {
  interviewId: string;
  startTime: string;
  pausedAt: string | null;
  pauseDuration: number;
}

export function InterviewTimer({ interviewId, startTime, pausedAt, pauseDuration }: InterviewTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(!!pausedAt);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000) - pauseDuration;
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, pauseDuration, isPaused]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    try {
      const action = isPaused ? 'resume' : 'pause';
      const response = await fetch(`/api/interview/${interviewId}/pause`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setIsPaused(!isPaused);
        toast.success(`Interview ${action}d`);
      }
    } catch (error) {
      toast.error('Failed to pause/resume interview');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Timer className="h-5 w-5 text-muted-foreground" />
        <span className="font-mono text-lg font-semibold">{formatTime(elapsedSeconds)}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handlePauseResume}
      >
        {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
        {isPaused ? 'Resume' : 'Pause'}
      </Button>
    </div>
  );
}

interface QuestionBookmarkProps {
  interviewId: string;
  questionNumber: number;
  question: string;
  answer: string;
  isBookmarked: boolean;
  onToggle: () => void;
}

export function QuestionBookmark({ 
  interviewId, 
  questionNumber, 
  question, 
  answer, 
  isBookmarked,
  onToggle 
}: QuestionBookmarkProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/interview/${interviewId}/bookmark`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_number: questionNumber }),
        });

        if (response.ok) {
          toast.success('Bookmark removed');
          onToggle();
        }
      } else {
        // Add bookmark
        const response = await fetch(`/api/interview/${interviewId}/bookmark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            question_number: questionNumber, 
            question,
            answer 
          }),
        });

        if (response.ok) {
          toast.success('Question bookmarked');
          onToggle();
        }
      }
    } catch (error) {
      toast.error('Failed to toggle bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleToggle}
      disabled={loading}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4 mr-2" />
      )}
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}

export function QuestionTimer({ startTime }: { startTime: Date }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      setSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const getColor = () => {
    if (seconds < 60) return 'text-green-600';
    if (seconds < 120) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Badge variant="outline" className={getColor()}>
      <Timer className="h-3 w-3 mr-1" />
      {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
    </Badge>
  );
}
