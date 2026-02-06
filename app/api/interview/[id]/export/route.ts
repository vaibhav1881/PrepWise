import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db();

    const interview = await db.collection('interviews').findOne({
      _id: new ObjectId(id)
    });

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found' },
        { status: 404 }
      );
    }

    // Calculate total time
    const startTime = new Date(interview.started_at).getTime();
    const endTime = interview.completed_at ? new Date(interview.completed_at).getTime() : new Date().getTime();
    const totalSeconds = Math.floor((endTime - startTime) / 1000) - (interview.pause_duration_seconds || 0);

    // Format export data
    const exportData = {
      interview_id: interview._id.toString(),
      role: interview.role_block?.role_name || 'N/A',
      difficulty: interview.role_block?.difficulty || 'N/A',
      categories: interview.role_block?.categories || [],
      date: interview.created_at,
      started_at: interview.started_at,
      completed_at: interview.completed_at,
      total_time_seconds: totalSeconds,
      total_time_formatted: formatTime(totalSeconds),
      status: interview.status,
      total_questions: interview.qa_history?.length || 0,
      pause_count: interview.pause_count || 0,
      questions: interview.qa_history?.map((qa: any, index: number) => ({
        number: index + 1,
        question: qa.question,
        answer: qa.answer,
        category: qa.category,
        evaluation: qa.evaluation,
        time_spent_seconds: qa.time_spent_seconds || 0
      })) || [],
      bookmarks: interview.bookmarked_questions || [],
      overall_score: 'Available after generating report',
    };

    return NextResponse.json(exportData, { status: 200 });
  } catch (error) {
    console.error('[Export Interview] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
