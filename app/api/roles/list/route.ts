import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const category = searchParams.get('category'); // 'my', 'popular', 'recent'
    const search = searchParams.get('search');

    const client = await clientPromise;
    const db = client.db();

    let query: any = {};

    // Filter by category
    if (category === 'my' && user_id) {
      query.creator_id = user_id;
    } else if (category === 'popular' || category === 'recent') {
      query.visibility = 'public';
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Get roles
    let roles = await db.collection('roles')
      .find(query)
      .sort(category === 'popular' ? { usage_count: -1 } : { created_at: -1 })
      .limit(category === 'popular' ? 20 : 100)
      .toArray();

    // Add creator username
    const userIds = [...new Set(roles.map(r => r.creator_id))];
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map((id: any) => typeof id === 'string' ? new ObjectId(id) : id) } })
      .toArray();
    
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u.name || u.email]));

    roles = roles.map((role: any) => ({
      ...role,
      _id: role._id.toString(),
      creator_name: userMap.get(typeof role.creator_id === 'string' ? role.creator_id : role.creator_id.toString()) || 'Unknown',
    }));

    return NextResponse.json(
      {
        message: 'Roles fetched successfully',
        roles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[List Roles] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
