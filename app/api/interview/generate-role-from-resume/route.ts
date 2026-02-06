import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, parseJsonResponse } from '@/lib/groq';
import { RoleBlock } from '@/lib/interview-types';
import clientPromise from '@/lib/mongodb';
const pdf = require('pdf-parse-new');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('resume') as File;
        const roleText = formData.get('role') as string;
        const experienceLevel = formData.get('experience_level') as string;
        const interviewTypesString = formData.get('interview_types') as string;
        const questionCountString = formData.get('question_count') as string;
        const userId = formData.get('user_id') as string;

        if (!file || !roleText || !experienceLevel) {
            return NextResponse.json(
                { message: 'Resume, role, and experience level are required' },
                { status: 400 }
            );
        }

        const interviewTypes = JSON.parse(interviewTypesString || '["technical"]');
        const questionCount = Number(questionCountString || 10);

        // Extract text from PDF
        let resumeText = '';
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const data = await pdf(buffer);
            resumeText = data.text;
        } catch (e) {
            console.error('PDF parsing error:', e);
            return NextResponse.json(
                { message: 'Failed to parse PDF file. Please ensure it is a valid PDF.' },
                { status: 400 }
            );
        }

        // Truncate resume text if too long (Groq token limits) - rough estimate
        // Maintaining key sections is hard without parsing, but usually end of parsing is safer to cut than beginning
        const MAX_RESUME_CHARS = 15000;
        if (resumeText.length > MAX_RESUME_CHARS) {
            resumeText = resumeText.substring(0, MAX_RESUME_CHARS);
        }

        const systemPrompt = `You are an expert technical interviewer and resume analyst.
Return ONLY valid JSON. No explanations.
Be strict and accurate.`;

        const userPrompt = `Analyze the following resume and target role to create a personalized interview plan.

INPUTS:
Target Role: ${roleText}
Experience Level: ${experienceLevel}
Resume Content:
${resumeText}

Interview Types: ${interviewTypes.join(', ')}
Total Questions: ${questionCount}

TASK:
1. Analyze the candidate's projects, work experience, and skills from the resume.
2. Identify key areas to probe based on the Target Role.
3. Create a structured interview "Role Block" that focuses on:
   - Projects mentioned in the resume (ask about architecture, challenges, your specific contribution).
   - Technologies listed (verify depth of knowledge).
   - Core concepts relevant to the Target Role.
   - Behavioral questions based on experience level.

Return JSON in this EXACT format:
{
  "role_name": "string (e.g., 'Senior React Developer - Resume Based')",
  "skills": ["skill1", "skill2", "skill3"],
  "difficulty": "easy|medium|hard",
  "evaluation_rubric": {
    "correctness": 5,
    "clarity": 5,
    "depth": 5,
    "relevance": 5
  },
  "context_notes": "Brief summary of what this interview focuses on based on the resume"
}

Important:
- format 'difficulty' should be strictly one of: "easy", "medium", "hard".
- 'skills' should include both generic role skills and specific tools found in the resume.
`;

        const groqResponse = await chatWithGroq({
            systemPrompt,
            userPrompt,
            temperature: 0.2,
        });

        if (!groqResponse.success || !groqResponse.content) {
            return NextResponse.json(
                { message: groqResponse.error || 'Failed to generate analysis' },
                { status: 500 }
            );
        }

        const parseResult = parseJsonResponse<RoleBlock>(groqResponse.content);

        if (!parseResult.success || !parseResult.data) {
            return NextResponse.json(
                { message: 'Failed to parse AI response', error: parseResult.error },
                { status: 500 }
            );
        }

        const roleBlock = parseResult.data;

        // Enhance role block with metadata
        const enhancedRoleBlock = {
            ...roleBlock,
            categories: interviewTypes,
            total_questions: questionCount,
            source: 'resume_analysis',
            resume_text_snippet: resumeText.substring(0, 500) + '...', // Save a snippet for debugging/context
            target_role: roleText,
            experience_level: experienceLevel
        };

        // Store in database
        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('role_blocks').insertOne({
            ...enhancedRoleBlock,
            created_at: new Date(),
        });

        const role_block_id = result.insertedId.toString();

        return NextResponse.json(
            {
                message: 'Resume analyzed and role generated successfully',
                role_block_id,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('[Resume Processor] Error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
