import OpenAI from 'openai';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

/**
 * Generates an answer completion from OpenAI based on the constructed RAG prompt.
 */
export async function generateAnswer(prompt: string): Promise<string> {
  const openai = getOpenAIClient();
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content?.trim() || 'No answer generated.';
}
