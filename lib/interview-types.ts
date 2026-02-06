// Interview Types and Interfaces

export type InterviewType = "technical" | "hr" | "behavioral" | "other";
export type InterviewCategory = InterviewType[];
export type DifficultyLevel = "easy" | "medium" | "hard";
export type InterviewStatus = "pending" | "in_progress" | "completed";

// Block 1: Role Block
export interface RoleBlock {
  role_name: string;
  skills: string[];
  difficulty: DifficultyLevel;
  evaluation_rubric: {
    correctness: number;
    clarity: number;
    depth: number;
    relevance: number;
  };
  categories: InterviewType[];
  custom_category?: string;
  total_questions: number;
}

// Block 2: Question Block
export interface QuestionBlock {
  intro: string;
  question: string;
  skill: string;
  difficulty: DifficultyLevel;
  category?: string;
}

// Memory Summary (Compressed State)
export interface MemorySummary {
  question_count: number;
  weak_skills: string[];
  strong_skills: string[];
  last_score: number;
  difficulty: DifficultyLevel;
  prev_answer_summary?: string; // Max 30 words
  needs_followup: boolean;
}

// Block 4: Evaluation Block
export interface EvaluationBlock {
  scores: {
    correctness: number;
    clarity: number;
    depth: number;
    relevance: number;
  };
  overall_score: number;
  weaknesses: string[];
  notes: string;
  needs_followup: boolean;
  followup_reason?: string; // "unclear answer" | "incomplete" | "wrong direction" | ""
}

// Block 5: Feedback Block
export interface FeedbackBlock {
  ideal_answer: string;
  mistakes: string[];
  improvement_tips: string[];
}

// Block 6: Final Report Block
export interface FinalReportBlock {
  summary: string;
  strengths: string[];
  weak_areas: string[];
  skill_scores: Record<string, number>;
  recommendations: string[];
  overall_performance: number;
}

// Interview Question & Answer
export interface InterviewQA {
  question_number: number;
  question: QuestionBlock;
  answer_text: string;
  answer_audio_url?: string;
  evaluation: EvaluationBlock;
  feedback: FeedbackBlock;
  timestamp: Date;
}

// Complete Interview Session
export interface InterviewSession {
  _id?: string;
  user_id: string;
  role_block: RoleBlock;
  status: InterviewStatus;
  current_question_number: number;
  memory_summary: MemorySummary;
  qa_history: InterviewQA[];
  final_report?: FinalReportBlock;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// API Request/Response Types

export interface CreateRoleBlockRequest {
  job_text: string;
  interview_types: InterviewType[];
  custom_type?: string;
  question_count?: number;
}

export interface GenerateQuestionRequest {
  interview_id: string;
}

export interface SubmitAnswerRequest {
  interview_id: string;
  answer_text: string;
  answer_audio_url?: string;
}

export interface TranscribeAudioRequest {
  audio: File;
}

export interface GenerateFeedbackRequest {
  interview_id: string;
  question_number: number;
}

export interface GenerateFinalReportRequest {
  interview_id: string;
}

// Helper function to create initial memory summary
export function createInitialMemory(): MemorySummary {
  return {
    question_count: 0,
    weak_skills: [],
    strong_skills: [],
    last_score: 0,
    difficulty: "medium",
    needs_followup: false,
  };
}

// Helper function to update memory after evaluation
export function updateMemorySummary(
  current: MemorySummary,
  evaluation: EvaluationBlock,
  question: QuestionBlock,
  answerText: string
): MemorySummary {
  const updated: MemorySummary = {
    question_count: current.question_count + 1,
    weak_skills: [...current.weak_skills],
    strong_skills: [...current.strong_skills],
    last_score: evaluation.overall_score,
    difficulty: current.difficulty,
    needs_followup: evaluation.needs_followup,
  };

  // Update skill tracking
  const skill = question.skill;
  if (evaluation.overall_score >= 8) {
    // Good performance (out of 10)
    if (!updated.strong_skills.includes(skill)) {
      updated.strong_skills.push(skill);
    }
    updated.weak_skills = updated.weak_skills.filter(s => s !== skill);
  } else if (evaluation.overall_score < 5) {
    // Poor performance
    if (!updated.weak_skills.includes(skill)) {
      updated.weak_skills.push(skill);
    }
    updated.strong_skills = updated.strong_skills.filter(s => s !== skill);
  }

  // Adjust difficulty
  if (evaluation.overall_score >= 9 && current.difficulty !== "hard") {
    updated.difficulty = current.difficulty === "easy" ? "medium" : "hard";
  } else if (evaluation.overall_score < 4 && current.difficulty !== "easy") {
    updated.difficulty = current.difficulty === "hard" ? "medium" : "easy";
  }

  // Create summary of previous answer (max 30 words)
  const words = answerText.split(/\s+/).slice(0, 30).join(' ');
  updated.prev_answer_summary = words + (answerText.split(/\s+/).length > 30 ? '...' : '');

  return updated;
}

// Validate audio file size (max 15MB)
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 15 * 1024 * 1024; // 15MB in bytes
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 15MB. Please record again.`,
    };
  }

  // Check file type
  const validTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid audio format. Supported formats: WebM, MP4, MP3, WAV, OGG`,
    };
  }

  return { valid: true };
}
