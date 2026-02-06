import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { role_id } = await request.json();

    if (!role_id) {
      return NextResponse.json(
        { message: 'role_id is required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Increment usage count
    await db.collection('roles').updateOne(
      { _id: new ObjectId(role_id) },
      { $inc: { usage_count: 1 } }
    );

    return NextResponse.json(
      {
        message: 'Usage count incremented',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Use Role] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
