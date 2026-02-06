import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { title, description, role_block, user_id, visibility } = await request.json();

    if (!title || !role_block || !user_id) {
      return NextResponse.json(
        { message: 'title, role_block, and user_id are required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Create role
    const role = {
      title,
      description: description || '',
      role_block,
      creator_id: user_id,
      visibility: visibility || 'public', // Default to public
      usage_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('roles').insertOne(role);

    return NextResponse.json(
      {
        message: 'Role created successfully',
        role_id: result.insertedId.toString(),
        role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Create Role] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
