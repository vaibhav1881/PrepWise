import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { message: 'user_id is required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const interviews = await db.collection('interviews')
      .find({ user_id })
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json(
      {
        interviews,
        count: interviews.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[List Interviews] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
