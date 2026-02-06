import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, parseJsonResponse } from '@/lib/groq';
import { EvaluationBlock, updateMemorySummary } from '@/lib/interview-types';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { interview_id, answer_text, answer_audio_url, question_started_at } = await request.json();

    if (!interview_id || !answer_text) {
      return NextResponse.json(
        { message: 'interview_id and answer_text are required' },
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

    if (!interview.current_question) {
      return NextResponse.json(
        { message: 'No active question found' },
        { status: 400 }
      );
    }

    const question = interview.current_question;
    const roleBlock = interview.role_block;

    // Check for empty or minimal answers - instant fail
    const trimmedAnswer = answer_text.trim();
    const wordCount = trimmedAnswer.split(/\s+/).filter((w: string) => w.length > 0).length;
    
    if (!trimmedAnswer || wordCount < 5) {
      // No answer or extremely short answer - automatic fail
      const evaluation = {
        scores: {
          correctness: 0,
          clarity: 0,
          depth: 0,
          relevance: 0
        },
        overall_score: 0,
        weaknesses: ["No meaningful answer provided", "Response is too short to evaluate"],
        notes: `Answer contains only ${wordCount} word(s). Minimum effort required.`,
        needs_followup: true,
        followup_reason: "no answer provided"
      };

      const answerSubmittedAt = new Date();
      const questionStart = question_started_at ? new Date(question_started_at) : answerSubmittedAt;
      const timeSpentSeconds = Math.floor((answerSubmittedAt.getTime() - questionStart.getTime()) / 1000);
      
      const qaEntry = {
        question_number: interview.current_question_number + 1,
        question,
        answer_text,
        answer_audio_url: answer_audio_url || null,
        evaluation,
        feedback: null,
        question_started_at: questionStart,
        answer_submitted_at: answerSubmittedAt,
        time_spent_seconds: timeSpentSeconds,
        timestamp: new Date(),
      };

      await db.collection('interviews').updateOne(
        { _id: new ObjectId(interview_id) },
        { 
          $set: { 
            memory_summary: interview.memory_summary,
            current_question_number: interview.current_question_number + 1,
            updated_at: new Date(),
          },
          $push: {
            qa_history: qaEntry as any
          },
          $unset: {
            current_question: ""
          }
        }
      );

      return NextResponse.json(
        {
          message: 'Answer evaluated - No meaningful response',
          evaluation,
          question_number: interview.current_question_number + 1,
          needs_followup: true,
        },
        { status: 200 }
      );
    }

    const systemPrompt = `You are an EXTREMELY STRICT technical interview evaluator for top-tier tech companies.
Your job is to identify weak, incomplete, or copied answers and give them LOW scores.
Be ruthlessly objective and penalize superficial answers heavily.
QUALITY IS EVERYTHING - if the answer lacks substance, technical accuracy, or depth, score it harshly.
Return ONLY valid JSON. No explanations.`;

    const userPrompt = `Question:
${question.question}

Skill Being Tested: ${question.skill}
Difficulty: ${question.difficulty}

Candidate Answer (${wordCount} words):
${answer_text}

Evaluation Rubric (max scores):
${JSON.stringify(roleBlock.evaluation_rubric, null, 2)}

CRITICAL EVALUATION CRITERIA - FOCUS ON QUALITY:

1. IMMEDIATE DISQUALIFIERS (Score 0-1 on ALL metrics if detected):
   - Answer just repeats/paraphrases the question
   - Answer is generic filler with no substance
   - Answer is obviously copied or AI-generated fluff
   - Answer shows zero technical understanding
   - Answer is completely off-topic
   - Answer is < 10 words (already checked, but penalize if close)

2. QUALITY-BASED SCORING:
   
   CORRECTNESS (0-${roleBlock.evaluation_rubric.correctness}):
   - 0: Completely wrong or no real answer
   - 1: Fundamentally incorrect understanding
   - 2: Partially correct but major gaps
   - 3: Mostly correct with minor issues
   - 4: Correct and accurate
   - 5: Perfect technical accuracy
   
   CLARITY (0-${roleBlock.evaluation_rubric.clarity}):
   - 0: Incoherent or nonsensical
   - 1: Extremely unclear or confusing
   - 2: Somewhat clear but poorly structured
   - 3: Clear with decent structure
   - 4: Very clear and well-organized
   - 5: Exceptionally articulate
   
   DEPTH (0-${roleBlock.evaluation_rubric.depth}):
   - 0: No depth whatsoever, surface-level only
   - 1: Extremely shallow, no examples or details
   - 2: Some attempt at depth but insufficient
   - 3: Adequate depth with some examples
   - 4: Good depth with multiple examples
   - 5: Exceptional depth with comprehensive coverage
   
   RELEVANCE (0-${roleBlock.evaluation_rubric.relevance}):
   - 0: Completely irrelevant to the question
   - 1: Barely related to the topic
   - 2: Somewhat relevant but misses key points
   - 3: Relevant and addresses main points
   - 4: Highly relevant and comprehensive
   - 5: Perfect alignment with question intent

3. WORD COUNT PENALTIES:
   - < 10 words: Maximum 1 total point
   - 10-20 words: Maximum 3 total points  
   - 20-30 words: Maximum 5 total points
   - 30-50 words: Can get up to 7 points if quality is good
   - 50+ words: Can get full range based on quality

4. REALISTIC SCORING DISTRIBUTION:
   - 0-2: No effort, copied, or completely wrong
   - 3-4: Poor quality, superficial understanding
   - 5-7: Average interview answer (THIS SHOULD BE MOST COMMON)
   - 8-9: Good answer with strong technical depth
   - 10: Exceptional answer (RARE - only for perfect responses)
Return JSON in this EXACT format:
{
  "scores": {
    "correctness": 0-${roleBlock.evaluation_rubric.correctness},
    "clarity": 0-${roleBlock.evaluation_rubric.clarity},
    "depth": 0-${roleBlock.evaluation_rubric.depth},
    "relevance": 0-${roleBlock.evaluation_rubric.relevance}
  },
  "overall_score": 0-10,
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "notes": "explain why this score was given, focusing on quality issues",
  "needs_followup": true|false,
  "followup_reason": "no answer|copied answer|too short|lacks depth|unclear|wrong direction" (empty string if false)
}

STRICT GUIDELINES - NO MERCY:
- If answer quality is poor, score 0-4 without hesitation
- If answer just restates the question: ALL scores 0-1, overall 0-2
- If answer has no technical substance: Maximum 3 total
- Only give high scores (8+) for genuinely impressive answers
- Be MUCH harder than a lenient grader - this is a TOP TECH COMPANY interview
- Focus on QUALITY over quantity, but penalize both short AND low-quality answers
- Set needs_followup to true for ANY weak answer (score < 6)`;

    const groqResponse = await chatWithGroq({
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temp for consistent evaluation
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        { message: groqResponse.error || 'Failed to evaluate answer' },
        { status: 500 }
      );
    }

    const parseResult = parseJsonResponse<EvaluationBlock>(groqResponse.content);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[Evaluator] Failed to parse:', groqResponse.content);
      return NextResponse.json(
        { message: 'Failed to parse AI response', error: parseResult.error },
        { status: 500 }
      );
    }

    const evaluation = parseResult.data;

    // Validate evaluation
    if (!evaluation.scores || typeof evaluation.overall_score !== 'number') {
      return NextResponse.json(
        { message: 'Invalid evaluation generated', data: evaluation },
        { status: 500 }
      );
    }

    // Update memory summary
    const updatedMemory = updateMemorySummary(
      interview.memory_summary,
      evaluation,
      question,
      answer_text
    );

    // Create QA entry
    const answerSubmittedAt = new Date();
    const questionStart = question_started_at ? new Date(question_started_at) : answerSubmittedAt;
    const timeSpentSeconds = Math.floor((answerSubmittedAt.getTime() - questionStart.getTime()) / 1000);
    
    const qaEntry = {
      question_number: interview.current_question_number + 1,
      question,
      answer_text,
      answer_audio_url: answer_audio_url || null,
      evaluation,
      feedback: null, // Feedback generated separately
      question_started_at: questionStart,
      answer_submitted_at: answerSubmittedAt,
      time_spent_seconds: timeSpentSeconds,
      timestamp: new Date(),
    };

    // Update interview
    await db.collection('interviews').updateOne(
      { _id: new ObjectId(interview_id) },
      { 
        $set: { 
          memory_summary: updatedMemory,
          current_question_number: interview.current_question_number + 1,
          updated_at: new Date(),
        },
        $push: {
          qa_history: qaEntry as any
        },
        $unset: {
          current_question: ""
        }
      }
    );

    return NextResponse.json(
      {
        message: 'Answer evaluated successfully',
        evaluation,
        question_number: interview.current_question_number + 1,
        needs_followup: evaluation.needs_followup,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Evaluator] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
