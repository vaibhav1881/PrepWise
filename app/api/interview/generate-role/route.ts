import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, parseJsonResponse } from '@/lib/groq';
import { RoleBlock, CreateRoleBlockRequest, InterviewType } from '@/lib/interview-types';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { job_text, interview_types, custom_type, question_count, save_role, role_title, role_description, visibility, user_id }: any = await request.json();

    if (!job_text || !interview_types || interview_types.length === 0) {
      return NextResponse.json(
        { message: 'job_text and at least one interview_type are required' },
        { status: 422 }
      );
    }

    // Validate custom type if "other" is selected
    if (interview_types.includes('other') && !custom_type) {
      return NextResponse.json(
        { message: 'custom_type must be specified when "other" is selected' },
        { status: 422 }
      );
    }

    const totalQuestions = question_count || 10;

    // Build interview type description
    const typeDescriptions = interview_types.map((type: InterviewType) => {
      if (type === 'other' && custom_type) return custom_type;
      return type;
    }).join(', ');

    const systemPrompt = `You are an interview architect.
Return ONLY valid JSON. No explanations.
Be strict and accurate.`;

    const userPrompt = `Given the following job role or description, create an interview role block.

Input:
Job Role / Description: ${job_text}
Interview Types: ${typeDescriptions}
Total Questions: ${totalQuestions}

Return JSON in this EXACT format:
{
  "role_name": "string (e.g., 'Senior Node.js Developer')",
  "skills": ["skill1", "skill2", "skill3"],
  "difficulty": "easy|medium|hard",
  "evaluation_rubric": {
    "correctness": 5,
    "clarity": 5,
    "depth": 5,
    "relevance": 5
  }
}

Important:
- Extract key skills from the job description
- Determine appropriate difficulty level
- Set evaluation criteria based on role complexity
- Focus on the interview types: ${typeDescriptions}`;

    const groqResponse = await chatWithGroq({
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temperature for more consistent output
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        { message: groqResponse.error || 'Failed to generate role block' },
        { status: 500 }
      );
    }

    const parseResult = parseJsonResponse<RoleBlock>(groqResponse.content);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[Role Generator] Failed to parse:', groqResponse.content);
      return NextResponse.json(
        { message: 'Failed to parse AI response', error: parseResult.error },
        { status: 500 }
      );
    }

    const roleBlock = parseResult.data;

    // Validate the role block
    if (!roleBlock.role_name || !roleBlock.skills || !roleBlock.difficulty || !roleBlock.evaluation_rubric) {
      return NextResponse.json(
        { message: 'Invalid role block generated', data: roleBlock },
        { status: 500 }
      );
    }

    // Add custom fields
    const enhancedRoleBlock = {
      ...roleBlock,
      categories: interview_types, // Use actual selected interview types instead of AI-generated categories
      custom_category: interview_types.includes('other') ? custom_type : undefined,
      total_questions: totalQuestions,
    };

    // Store in database
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('role_blocks').insertOne({
      ...enhancedRoleBlock,
      created_at: new Date(),
    });

    const role_block_id = result.insertedId.toString();

    // Optionally save as reusable role
    let saved_role_id = null;
    if (save_role && role_title && user_id) {
      const roleResult = await db.collection('roles').insertOne({
        title: role_title,
        description: role_description || '',
        role_block: enhancedRoleBlock,
        creator_id: user_id,
        visibility: visibility || 'public', // Default to public
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      saved_role_id = roleResult.insertedId.toString();
    }

    return NextResponse.json(
      {
        message: 'Role block created successfully',
        role_block: enhancedRoleBlock,
        role_block_id,
        saved_role_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Role Generator] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
