import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, parseJsonResponse } from '@/lib/groq';
import { FeedbackBlock } from '@/lib/interview-types';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { interview_id, question_number } = await request.json();

    if (!interview_id || typeof question_number !== 'number') {
      return NextResponse.json(
        { message: 'interview_id and question_number are required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get interview session
    const interview = await db.collection('interviews').findOne({
      _id: new ObjectId(interview_id)
    });

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found' },
        { status: 404 }
      );
    }

    // Find the QA entry
    const qaEntry = interview.qa_history.find((qa: any) => qa.question_number === question_number);
    
    if (!qaEntry) {
      return NextResponse.json(
        { message: 'Question/Answer not found' },
        { status: 404 }
      );
    }

    if (qaEntry.feedback) {
      // Feedback already exists
      return NextResponse.json(
        {
          message: 'Feedback already exists',
          feedback: qaEntry.feedback,
        },
        { status: 200 }
      );
    }

    const systemPrompt = `You are a mentor and interview coach.
Give concise, actionable feedback.
Be encouraging but honest.
Return ONLY valid JSON. No explanations.`;

    const userPrompt = `Question:
${qaEntry.question.question}

Candidate Answer:
${qaEntry.answer_text}

Evaluation:
${JSON.stringify(qaEntry.evaluation, null, 2)}

Generate constructive feedback and return JSON in this EXACT format:
{
  "ideal_answer": "What a strong answer would include (2-3 sentences)",
  "mistakes": ["mistake1", "mistake2"],
  "improvement_tips": ["tip1", "tip2", "tip3"]
}

Guidelines:
- ideal_answer should be brief but comprehensive
- mistakes should be specific and actionable
- improvement_tips should be practical and encouraging
- Keep it concise - candidate needs to move forward`;

    const groqResponse = await chatWithGroq({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        { message: groqResponse.error || 'Failed to generate feedback' },
        { status: 500 }
      );
    }

    const parseResult = parseJsonResponse<FeedbackBlock>(groqResponse.content);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[Feedback Generator] Failed to parse:', groqResponse.content);
      return NextResponse.json(
        { message: 'Failed to parse AI response', error: parseResult.error },
        { status: 500 }
      );
    }

    const feedback = parseResult.data;

    // Update the QA entry with feedback
    await db.collection('interviews').updateOne(
      { 
        _id: new ObjectId(interview_id),
        'qa_history.question_number': question_number 
      },
      { 
        $set: { 
          'qa_history.$.feedback': feedback,
          updated_at: new Date(),
        }
      }
    );

    return NextResponse.json(
      {
        message: 'Feedback generated successfully',
        feedback,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Feedback Generator] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
