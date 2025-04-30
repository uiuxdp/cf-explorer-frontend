import { fetchSheetData } from '@/lib/utils';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject } from 'ai';
import { z } from 'zod';

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
  maxRetries: 1,
});

let FEEDBACK_DATABASE;

// Helper function to get sentiment color
function getSentimentColor(sentiment) {
  if (sentiment === 'Negative') return '#FF0000';
  if (sentiment === 'Positive') return '#00FF00';
  return '#FFBF00'; // neutral
}

// Helper function to get sentiment message
function getSentimentMessage(sentiment) {
  if (sentiment === 'Negative') return '⚠️ Requires Attention: Consider immediate service improvements';
  if (sentiment === 'Positive') return '✅ Positive Feedback: Service meeting user expectations';
  return '⚖️ Neutral Feedback: Room for improvement';
}

function searchFeedback(params) {
  let results = [...FEEDBACK_DATABASE];
  
  if (params.service && params.service.toLowerCase() !== 'all') {
    results = results.filter(item => 
      item['Sub-Channels'].toLowerCase().includes(params.service.toLowerCase())
    );
  }
  
  if (params.sentiment) {
    results = results.filter(item => 
      item.Sentiment.toLowerCase() === params.sentiment.toLowerCase()
    );
  }
  
  if (params.dateRange) {
    results = results.filter(item => 
      item.Date.includes(params.dateRange)
    );
  }
  
  if (params.rating) {
    results = results.filter(item => 
      item.Sentan === params.rating
    );
  }
  
  return results;
}

function calculateFeedbackStats(feedbackItems) {
  if (!feedbackItems || feedbackItems.length === 0) {
    return {
      avgRating: 0,
      sentimentBreakdown: { Positive: 0, Neutral: 0, Negative: 0 },
      serviceBreakdown: {},
      totalFeedback: 0
    };
  }

  const totalFeedback = feedbackItems.length;
  const avgRating = feedbackItems.reduce((sum, item) => sum + parseInt(item.Sentan), 0) / totalFeedback;
  
  const sentimentBreakdown = feedbackItems.reduce((acc, item) => {
    acc[item.Sentiment] = (acc[item.Sentiment] || 0) + 1;
    return acc;
  }, { Positive: 0, Neutral: 0, Negative: 0 });
  
  const serviceBreakdown = feedbackItems.reduce((acc, item) => {
    const service = item['Sub-Channels'];
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});
  
  return {
    avgRating: parseFloat(avgRating.toFixed(1)),
    sentimentBreakdown,
    serviceBreakdown,
    totalFeedback
  };
}

async function processFeedbackQuery(userMessage) {
  const model = lmstudio('qwen2.5-7b-instruct');
  FEEDBACK_DATABASE = await fetchSheetData();
  
  // Get all feedback as we're only doing quality check
  const relevantFeedback = searchFeedback({});
  const feedbackStats = calculateFeedbackStats(relevantFeedback);

  // Quality Check Agent
  const { object: qualityCheck } = await generateObject({
    model,
    schema: z.object({
      insightAccuracy: z.number().min(1).max(10),
      dataRelevance: z.number().min(1).max(10),
      actionability: z.number().min(1).max(10),
      feedbackQuality: z.string(),
      recommendations: z.array(z.string()),
    }),
    prompt: `As a Quality Check Agent for Dubai Police website feedback, analyze the following data:

    Feedback Statistics:
    ${JSON.stringify(feedbackStats, null, 2)}

    Sample Feedback:
    ${JSON.stringify(relevantFeedback.slice(0, 5), null, 2)}

    Evaluate:
    1. Insight accuracy (1-10)
    2. Data relevance (1-10)
    3. Actionability (1-10)
    4. Overall feedback quality assessment
    5. List 3 key recommendations for improvement

    User query: ${userMessage}`,
  });

  const dominantSentiment = Object.entries(feedbackStats.sentimentBreakdown)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];

  return {
    response: `Quality Check Report:\n
    - Insight Accuracy: ${qualityCheck.insightAccuracy}/10
    - Data Relevance: ${qualityCheck.dataRelevance}/10
    - Actionability: ${qualityCheck.actionability}/10
    - Overall Quality: ${qualityCheck.feedbackQuality}
    
    Recommendations:
    ${qualityCheck.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}`,
    analysis: {
      feedbackStats,
      relevantFeedback: relevantFeedback.slice(0, 10),
      sentimentColors: {
        Positive: getSentimentColor('Positive'),
        Neutral: getSentimentColor('Neutral'),
        Negative: getSentimentColor('Negative')
      },
      dominantSentiment
    },
    qualityMetrics: qualityCheck
  };
}

export const maxDuration = 300;

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;
    const result = await processFeedbackQuery(userMessage);

    return new Response(JSON.stringify({
      text: result.response,
      metadata: {
        analysis: result.analysis,
        qualityMetrics: result.qualityMetrics,
        styling: {
          borderColor: getSentimentColor(result.analysis.dominantSentiment),
          sentimentMessage: getSentimentMessage(result.analysis.dominantSentiment),
          feedbackCount: result.analysis.feedbackStats.totalFeedback
        }
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