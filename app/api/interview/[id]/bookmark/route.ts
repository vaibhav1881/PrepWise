import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { question_number, question, answer, note } = await request.json();

    const client = await clientPromise;
    const db = client.db();

    const bookmark = {
      question_number,
      question,
      answer: answer || '',
      note: note || '',
      bookmarked_at: new Date()
    };

    await db.collection('interviews').updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { bookmarked_questions: bookmark } as any,
        $set: { updated_at: new Date() }
      }
    );

    return NextResponse.json(
      {
        message: 'Question bookmarked successfully',
        bookmark
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Bookmark Question] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { question_number } = await request.json();

    const client = await clientPromise;
    const db = client.db();

    await db.collection('interviews').updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { bookmarked_questions: { question_number } } as any,
        $set: { updated_at: new Date() }
      }
    );

    return NextResponse.json(
      {
        message: 'Bookmark removed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Remove Bookmark] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
