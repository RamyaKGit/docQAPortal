import OpenAI from 'openai';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/**
 * Generates an answer completion from OpenAI based on chat messages or prompt.
 */
export async function generateAnswer(input: string | ChatMessage[]): Promise<string> {
  const openai = getOpenAIClient();
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  const messages: ChatMessage[] = typeof input === 'string'
    ? [{ role: 'user', content: input }]
    : input;

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content?.trim() || 'No answer generated.';
}
