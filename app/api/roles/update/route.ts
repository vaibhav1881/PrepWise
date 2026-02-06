import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(request: NextRequest) {
  try {
    const { role_id, visibility, user_id } = await request.json();

    if (!role_id || !visibility || !user_id) {
      return NextResponse.json(
        { message: 'role_id, visibility, and user_id are required' },
        { status: 422 }
      );
    }

    if (!['private', 'public'].includes(visibility)) {
      return NextResponse.json(
        { message: 'visibility must be either "private" or "public"' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if the user is the owner of the role
    const role = await db.collection('roles').findOne({
      _id: new ObjectId(role_id)
    });

    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    // Only the creator can update the role visibility
    if (role.creator_id !== user_id) {
      return NextResponse.json(
        { message: 'Unauthorized: Only the role owner can update visibility' },
        { status: 403 }
      );
    }

    const result = await db.collection('roles').updateOne(
      { _id: new ObjectId(role_id) },
      { 
        $set: { 
          visibility,
          updated_at: new Date(),
        }
      }
    );

    return NextResponse.json(
      {
        message: 'Role visibility updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Update Role] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
