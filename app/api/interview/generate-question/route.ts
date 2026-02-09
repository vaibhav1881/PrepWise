import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, parseJsonResponse } from '@/lib/groq';
import { QuestionBlock } from '@/lib/interview-types';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { interview_id } = await request.json();

    if (!interview_id) {
      return NextResponse.json(
        { message: 'interview_id is required' },
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

    // Check if interview has reached question limit
    const totalQuestions = interview.role_block?.total_questions || 5;
    const currentQuestionNumber = interview.current_question_number || 0;

    if (currentQuestionNumber >= totalQuestions) {
      return NextResponse.json(
        { message: 'Interview completed - question limit reached', completed: true },
        { status: 200 }
      );
    }

    // Determine which question type to ask next
    const questionTypeTracker = interview.question_type_tracker || {};
    const askedTypeCount = interview.asked_type_count || {};

    // Find the type with the most questions remaining
    let nextQuestionType = 'technical'; // default
    let maxRemaining = -1;

    for (const type in questionTypeTracker) {
      const target = questionTypeTracker[type];
      const asked = askedTypeCount[type] || 0;
      const remaining = target - asked;

      if (remaining > maxRemaining) {
        maxRemaining = remaining;
        nextQuestionType = type;
      }
    }

    // Get the last question and answer for context
    const lastQA = interview.qa_history?.[interview.qa_history.length - 1];
    const contextInfo = lastQA ? `

Previous Question: ${lastQA.question}
Previous Answer: ${lastQA.answer}
Previous Evaluation: ${JSON.stringify(lastQA.evaluation)}` : '';

    const systemPrompt = `You are a human interviewer.
Ask one question at a time.
Adapt difficulty and focus based on candidate's performance.
Sound natural and professional.
Return ONLY valid JSON. No explanations.`;

    // Determine strict 20/80 split for Coding/Theory
    let technicalStyle = 'theory';

    if (nextQuestionType === 'technical') {
      const qaHistory = interview.qa_history || [];
      let codingCount = 0;
      qaHistory.forEach((qa: any) => {
        if (qa.question_style === 'coding' || (qa.category === 'technical' && qa.question?.toLowerCase().includes('write code'))) {
          codingCount++;
        }
      });

      // 20% of total questions should be coding (min 1)
      const totalQs = interview.role_block?.total_questions || 5;
      const maxCoding = Math.max(1, Math.round(totalQs * 0.2));
      const remainingQuestions = totalQs - currentQuestionNumber;
      const questionsNeeded = Math.max(0, maxCoding - codingCount);

      // Selection Logic:
      // 1. If we already hit the max, force THEORY
      if (codingCount >= maxCoding) {
        technicalStyle = 'theory';
      }
      // 2. If we MUST ask a coding question to hit the target (remaining == needed), force CODING
      else if (remainingQuestions <= questionsNeeded) {
        technicalStyle = 'coding';
      }
      // 3. Otherwise, randomize (bias towards theory, but leave room for coding if needed)
      else {
        technicalStyle = Math.random() < 0.3 ? 'coding' : 'theory';
      }
    }

    const userPrompt = `Role Block:
${JSON.stringify(interview.role_block, null, 2)}

Interview State:
${JSON.stringify(interview.memory_summary, null, 2)}${contextInfo}

Current Question: ${currentQuestionNumber + 1} of ${totalQuestions}

CRITICAL REQUIREMENT: The next question MUST be of category: "${nextQuestionType}"
${nextQuestionType === 'technical' ? `
SPECIFIC TECHNICAL STYLE: "${technicalStyle}"
1. "theory": Ask a deep conceptual question based on the resume/role. User should explain verbally/text. No coding required.
2. "coding": LeetCode-style algorithmic or practical coding challenge. User must write code in the editor. Focus on logic, data structures, or specific implementation using Standard Libraries only.
` : ''}

DO NOT generate questions from other categories.
ONLY generate "${nextQuestionType}" category questions.

Generate the next interview question.

Return JSON in this EXACT format:
{
  "intro": "Brief natural introduction to the question (optional, can be empty string)",
  "question": "The actual question to ask",
  "skill": "The skill being tested",
  "difficulty": "easy|medium|hard",
  "category": "${nextQuestionType}",
  "question_style": "${nextQuestionType === 'technical' ? technicalStyle : 'theory'}"
}

Guidelines:
- ABSOLUTELY CRITICAL: The question category MUST be "${nextQuestionType}"
${nextQuestionType === 'technical' ? `- STRICTLY follow the "${technicalStyle}" style.` : ''}
- If "${technicalStyle}" is "coding", ensure the problem is solvable within the editor using Standard Libraries.
- If "${nextQuestionType}" is "hr", ask ONLY HR questions about soft skills.
- If "${nextQuestionType}" is "behavioral", ask ONLY behavioral questions (STAR method).
- Build upon the previous answer and evaluation to create a flow.
- Keep questions clear and specific`;

    const groqResponse = await chatWithGroq({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        { message: groqResponse.error || 'Failed to generate question' },
        { status: 500 }
      );
    }

    const parseResult = parseJsonResponse<QuestionBlock>(groqResponse.content);

    if (!parseResult.success || !parseResult.data) {
      console.error('[Question Generator] Failed to parse:', groqResponse.content);
      return NextResponse.json(
        { message: 'Failed to parse AI response', error: parseResult.error },
        { status: 500 }
      );
    }

    const questionBlock = parseResult.data;

    // Validate question block
    if (!questionBlock.question || !questionBlock.skill || !questionBlock.difficulty) {
      return NextResponse.json(
        { message: 'Invalid question block generated', data: questionBlock },
        { status: 500 }
      );
    }

    // Update interview with current question and increment asked count for this type
    const updateFields: any = {
      current_question: questionBlock,
      updated_at: new Date(),
    };

    // Increment the count for this question type
    const updatedAskedTypeCount = interview.asked_type_count || {};
    const currentCategory = questionBlock.category || nextQuestionType;
    updatedAskedTypeCount[currentCategory] = (updatedAskedTypeCount[currentCategory] || 0) + 1;
    updateFields.asked_type_count = updatedAskedTypeCount;

    await db.collection('interviews').updateOne(
      { _id: new ObjectId(interview_id) },
      { $set: updateFields }
    );

    return NextResponse.json(
      {
        message: 'Question generated successfully',
        question: questionBlock,
        question_number: interview.current_question_number + 1,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Question Generator] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
