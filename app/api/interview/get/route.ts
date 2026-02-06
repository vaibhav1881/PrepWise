import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const interview_id = searchParams.get('interview_id');

    if (!interview_id) {
      return NextResponse.json(
        { message: 'interview_id is required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const interview = await db.collection('interviews').findOne({
      _id: new ObjectId(interview_id)
    });

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        interview,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Get Interview] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
