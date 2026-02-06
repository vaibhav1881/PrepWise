import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  try {
    const { role_id, user_id } = await request.json();

    if (!role_id || !user_id) {
      return NextResponse.json(
        { message: 'role_id and user_id are required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if role exists and user is the creator
    const role = await db.collection('roles').findOne({
      _id: new ObjectId(role_id)
    });

    if (!role) {
      return NextResponse.json(
        { message: 'Role not found' },
        { status: 404 }
      );
    }

    if (role.creator_id !== user_id) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this role' },
        { status: 403 }
      );
    }

    // Delete the role
    await db.collection('roles').deleteOne({
      _id: new ObjectId(role_id)
    });

    return NextResponse.json(
      { message: 'Role deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Delete Role] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
