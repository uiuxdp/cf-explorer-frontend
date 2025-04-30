import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
  maxRetries: 1, // immediately error if the server is not running
});

async function processUserQuery(userMessage) {
  const model = lmstudio('qwen2.5-7b-instruct-1m');

  // Step 1: Analyze the user's query
  const { object: queryAnalysis } = await generateObject({
    model,
    schema: z.object({
      intent: z.enum(['question', 'task', 'conversation']),
      complexity: z.number().min(1).max(10),
      requiredContext: z.array(z.string()),
    }),
    prompt: `Analyze this user query and determine:
      1. The type of intent
      2. Complexity level (1-10)
      3. Required context or information needed

      User query: ${userMessage}`,
  });

  // Step 2: Generate initial response
  const { text: initialResponse } = await generateText({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Consider this context:
          - Query intent: ${queryAnalysis.intent}
          - Complexity: ${queryAnalysis.complexity}
          - Required context: ${queryAnalysis.requiredContext.join(', ')}`
      },
      { role: 'user', content: userMessage }
    ],
  });

  // Step 3: Evaluate response quality
  const { object: qualityCheck } = await generateObject({
    model,
    schema: z.object({
      completeness: z.number().min(1).max(10),
      clarity: z.number().min(1).max(10),
      accuracy: z.number().min(1).max(10),
    }),
    prompt: `Evaluate this response for:
      1. Completeness (1-10)
      2. Clarity (1-10)
      3. Accuracy (1-10)

      Response to evaluate: ${initialResponse}`,
  });

  // Step 4: Improve response if needed
  if (
    qualityCheck.completeness < 7 ||
    qualityCheck.clarity < 7 ||
    qualityCheck.accuracy < 7
  ) {
    const { text: improvedResponse } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `Improve this response with:
            ${qualityCheck.completeness < 7 ? '- More complete information' : ''}
            ${qualityCheck.clarity < 7 ? '- Better clarity and explanation' : ''}
            ${qualityCheck.accuracy < 7 ? '- More precise and accurate details' : ''}
            
            Original response: ${initialResponse}`
        },
        { role: 'user', content: userMessage }
      ],
    });

    return {
      response: improvedResponse,
      analysis: queryAnalysis,
      qualityMetrics: qualityCheck,
      improved: true
    };
  }

  return {
    response: initialResponse,
    analysis: queryAnalysis,
    qualityMetrics: qualityCheck,
    improved: false
  };
}

export const maxDuration = 300; // Increased timeout for multi-step process

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    const result = await processUserQuery(userMessage);
    console.log('Process result:', result);

    return new Response(JSON.stringify({
      text: result.response,
      metadata: {
        analysis: result.analysis,
        qualityMetrics: result.qualityMetrics,
        improved: result.improved
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
