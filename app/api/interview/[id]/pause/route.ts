import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // 'pause' or 'resume'

    if (!action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { message: 'action must be either "pause" or "resume"' },
        { status: 422 }
      );
    }

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

    const updateData: any = {
      updated_at: new Date()
    };

    if (action === 'pause') {
      updateData.status = 'paused';
      updateData.paused_at = new Date();
      updateData.pause_count = (interview.pause_count || 0) + 1;
    } else if (action === 'resume') {
      updateData.status = 'in_progress';
      
      // Calculate pause duration if there was a pause
      if (interview.paused_at) {
        const pauseDuration = Math.floor((new Date().getTime() - new Date(interview.paused_at).getTime()) / 1000);
        updateData.pause_duration_seconds = (interview.pause_duration_seconds || 0) + pauseDuration;
      }
      
      updateData.paused_at = null;
    }

    await db.collection('interviews').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json(
      {
        message: `Interview ${action}d successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Pause/Resume Interview] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
