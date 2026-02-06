import Groq from "groq-sdk";

const groqApiKey = process.env.GROQ_API_Key;

if (!groqApiKey) {
  console.warn('[Groq] API key not found. AI features will be disabled.');
}

export const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Token limits for llama-3.1-8b-instant
export const MODEL_LIMITS = {
  model: "llama-3.1-8b-instant",
  maxContextTokens: 8000,
  maxResponseTokens: 2000,
  safeContextTokens: 6000, // Leave room for response
};

// Rough token estimation (1 token ≈ 4 chars for English)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Check if context is within safe limits
export function isContextSafe(text: string): boolean {
  const tokens = estimateTokens(text);
  return tokens <= MODEL_LIMITS.safeContextTokens;
}

// Truncate text to fit token limit
export function truncateToTokenLimit(text: string, maxTokens: number = MODEL_LIMITS.safeContextTokens): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  const ratio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 90% to be safe
  return text.slice(0, targetLength);
}

interface GroqChatParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chatWithGroq({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = MODEL_LIMITS.maxResponseTokens,
}: GroqChatParams): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!groq) {
    return {
      success: false,
      error: "Groq API not configured. Please set GROQ_API_Key in environment variables.",
    };
  }

  try {
    // Check token limits
    const totalContext = systemPrompt + userPrompt;
    if (!isContextSafe(totalContext)) {
      console.warn('[Groq] Context exceeds safe token limit. Truncating...');
      // Could implement smarter truncation here
    }

    const completion = await groq.chat.completions.create({
      model: MODEL_LIMITS.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      return {
        success: false,
        error: "No response from Groq API",
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Groq] Error:', errorMsg);
    return {
      success: false,
      error: `Groq API error: ${errorMsg}`,
    };
  }
}

// Parse JSON response from LLM
export function parseJsonResponse<T>(content: string): { success: boolean; data?: T; error?: string } {
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonStr = content.trim();
    
    // Remove markdown code blocks
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    
    const data = JSON.parse(jsonStr) as T;
    return { success: true, data };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to parse JSON: ${errorMsg}`,
    };
  }
}
