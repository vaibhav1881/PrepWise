import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, parseJsonResponse } from '@/lib/groq';
import { FinalReportBlock } from '@/lib/interview-types';
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

    if (interview.final_report) {
      // Report already exists
      return NextResponse.json(
        {
          message: 'Final report already exists',
          report: interview.final_report,
        },
        { status: 200 }
      );
    }

    // Aggregate scores and performance
    const qaHistory = interview.qa_history || [];
    
    if (qaHistory.length === 0) {
      return NextResponse.json(
        { message: 'No questions answered yet' },
        { status: 400 }
      );
    }

    // Calculate aggregated data
    const skillScores: Record<string, { total: number; count: number }> = {};
    let totalScore = 0;
    const allNotes: string[] = [];

    qaHistory.forEach((qa: any) => {
      const skill = qa.question.skill;
      const score = qa.evaluation.overall_score;
      
      if (!skillScores[skill]) {
        skillScores[skill] = { total: 0, count: 0 };
      }
      
      skillScores[skill].total += score;
      skillScores[skill].count += 1;
      totalScore += score;
      
      if (qa.evaluation.notes) {
        allNotes.push(`Q${qa.question_number}: ${qa.evaluation.notes}`);
      }
    });

    const avgSkillScores: Record<string, number> = {};
    Object.keys(skillScores).forEach(skill => {
      avgSkillScores[skill] = Math.round(skillScores[skill].total / skillScores[skill].count);
    });

    const overallPerformance = Math.round(totalScore / qaHistory.length);

    const systemPrompt = `You are an interview coach and career advisor.
Generate a comprehensive final interview report.
Be honest but encouraging.
Provide actionable recommendations.
Return ONLY valid JSON. No explanations.`;

    const userPrompt = `Role Block:
${JSON.stringify(interview.role_block, null, 2)}

Interview Statistics:
- Total Questions: ${qaHistory.length}
- Average Score: ${overallPerformance}/20
- Skill Breakdown: ${JSON.stringify(avgSkillScores, null, 2)}

Strong Skills: ${interview.memory_summary.strong_skills.join(', ') || 'None identified'}
Weak Areas: ${interview.memory_summary.weak_skills.join(', ') || 'None identified'}

Evaluation Notes:
${allNotes.join('\n')}

Generate a final interview report and return JSON in this EXACT format:
{
  "summary": "2-3 paragraph overall summary of performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "weak_areas": ["area1", "area2"],
  "skill_scores": {
    "skill_name": score_out_of_20
  },
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "overall_performance": ${overallPerformance}
}

Guidelines:
- summary should be professional and balanced
- strengths should highlight what went well
- weak_areas should be constructive
- recommendations should be specific and actionable
- Include both technical and soft skill feedback if applicable`;

    const groqResponse = await chatWithGroq({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 2000,
    });

    if (!groqResponse.success || !groqResponse.content) {
      return NextResponse.json(
        { message: groqResponse.error || 'Failed to generate final report' },
        { status: 500 }
      );
    }

    const parseResult = parseJsonResponse<FinalReportBlock>(groqResponse.content);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[Final Report] Failed to parse:', groqResponse.content);
      return NextResponse.json(
        { message: 'Failed to parse AI response', error: parseResult.error },
        { status: 500 }
      );
    }

    const finalReport = {
      ...parseResult.data,
      skill_scores: avgSkillScores, // Use calculated scores
      overall_performance: overallPerformance,
    };

    // Update interview with final report and mark as completed
    await db.collection('interviews').updateOne(
      { _id: new ObjectId(interview_id) },
      { 
        $set: { 
          final_report: finalReport,
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date(),
        }
      }
    );

    return NextResponse.json(
      {
        message: 'Final report generated successfully',
        report: finalReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Final Report] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
