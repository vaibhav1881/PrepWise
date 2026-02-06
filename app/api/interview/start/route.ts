import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createInitialMemory, InterviewType } from '@/lib/interview-types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { user_id, role_block_id, role_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { message: 'user_id is required' },
        { status: 422 }
      );
    }

    if (!role_block_id && !role_id) {
      return NextResponse.json(
        { message: 'Either role_block_id or role_id is required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    let roleBlock;

    // If using saved role, increment usage count and get role block
    if (role_id) {
      const role = await db.collection('roles').findOne({
        _id: new ObjectId(role_id)
      });

      if (!role) {
        return NextResponse.json(
          { message: 'Role not found' },
          { status: 404 }
        );
      }

      roleBlock = role.role_block;

      // Increment usage count
      await db.collection('roles').updateOne(
        { _id: new ObjectId(role_id) },
        { $inc: { usage_count: 1 } }
      );
    } else {
      // Get role block by ID
      roleBlock = await db.collection('role_blocks').findOne({
        _id: new ObjectId(role_block_id)
      });

      if (!roleBlock) {
        return NextResponse.json(
          { message: 'Role block not found' },
          { status: 404 }
        );
      }
    }

    // Calculate questions per type
    const interviewTypes = roleBlock.categories || ['technical'];
    const totalQuestions = roleBlock.total_questions || 10;
    const questionsPerType: any = {};
    
    // Distribute questions evenly across types
    const typesCount = interviewTypes.length;
    const baseQuestionsPerType = Math.floor(totalQuestions / typesCount);
    const remainder = totalQuestions % typesCount;
    
    interviewTypes.forEach((type: string, index: number) => {
      questionsPerType[type] = baseQuestionsPerType + (index < remainder ? 1 : 0);
    });

    // Create interview session
    const interview = {
      user_id,
      role_block: roleBlock,
      status: 'in_progress',
      current_question_number: 0,
      memory_summary: createInitialMemory(),
      qa_history: [],
      question_type_tracker: questionsPerType, // Track how many questions of each type to ask
      asked_type_count: {}, // Track how many of each type have been asked
      started_at: new Date(),
      completed_at: null,
      total_time_seconds: 0,
      paused_at: null,
      pause_duration_seconds: 0,
      pause_count: 0,
      bookmarked_questions: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('interviews').insertOne(interview);

    return NextResponse.json(
      {
        message: 'Interview started successfully',
        interview_id: result.insertedId.toString(),
        interview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Start Interview] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
