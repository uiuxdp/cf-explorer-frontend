import {
  addDocument,
  createEmbedding,
  findSimilarDocuments,
} from "@/app/rag/actions";
import { fetchSheetData } from "@/lib/utils";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, generateObject, streamText, tool, embed, toDataStreamResponse } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server"
import  Database  from "better-sqlite3"
import path from "path"
import { MODEL_EMBED, MODEL_LLM } from "../../../lib/constants";

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  // baseURL: 'http://localhost:1234/v1',
  baseURL: "http://10.90.115.176:1234/v1",
  maxRetries: 1, // immediately error if the server is not running
});

// Initialize database
const dbPath = path.join(process.cwd(), "data", "rag.db")

// Function to embed text using Nomic model (same as in embed route)
async function embedText(text) {
  // In a real implementation, you would call your LM Studio API here
  // For now, we'll simulate the embedding with random values
  // const dimensions = 384 // Adjust based on your model's output dimensions
  // return Array.from({ length: dimensions }, () => Math.random() * 2 - 1)

  try {
    // Use an embedding model from LM Studio
    const embeddingModelName = MODEL_EMBED // Replace with your actual model

    const result = await embed({
      model: lmstudio.textEmbeddingModel(embeddingModelName),
      value: text,
      maxRetries: 1,
    })

    return result.embedding
  } catch (error) {
    console.error("Error creating embedding:", error)
    throw new Error("Failed to create embedding. Make sure LM Studio server is running with an embedding model.")
  }
}

// // Function to calculate cosine similarity
// function cosineSimilarity(a, b) {
//   let dotProduct = 0
//   let normA = 0
//   let normB = 0

//   for (let i = 0; i < a.length; i++) {
//     dotProduct += a[i] * b[i]
//     normA += a[i] * a[i]
//     normB += b[i] * b[i]
//   }
//   return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
// }


function cosineSimilarity(a, b) {


  

  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}



// Function to retrieve relevant context
async function retrieveContext(query, limit = 36) {

  const db = new Database(dbPath)

  const queryEmbedding = await embedText(query)


  const entries = db.prepare("SELECT * FROM entries").all()


  const entriesWithEmbeddings = entries.map((entry, index) => {
   
    if (!entry.embedding || entry.embedding.byteLength === 0) {
      console.warn(`Entry at index ${index} has no valid embedding.`);
      return { ...entry, embedding: [] };
    }
  
    try {
      const buffer = entry.embedding;
  
      const float32Array = new Float32Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength / 4
      );
  
      const array = Array.from(float32Array);
      console.log(array,`Entry at index  ${index} of ${array.length} produced empty array after conversion.`);
      if (array.length === 0) {
        console.warn(`Entry at index ${index} produced empty array after conversion.`);
      }
    
      return { ...entry, embedding: array };
    } catch (error) {
      console.error(`Failed to process embedding for entry at index ${index}:`, error);
      return { ...entry, embedding: [] };
    }
  });
 
 
  // Calculate similarities
  const entriesWithSimilarity = entriesWithEmbeddings.map((entry) => ({
    ...entry,
    similarity: cosineSimilarity(queryEmbedding, entry.embedding) ,
  }))

  // Sort by similarity and get top results
  const topEntries = entriesWithSimilarity.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  console.log(topEntries.length,`Entryyyy length`);
  db.close()

  return topEntries
    .map(
      (entry) => `
Number: ${entry.number}
Date: ${entry.date}
Sub-Channels: ${entry.sub_channels}
Comments: ${entry.comments}
Sentiment: ${entry.sentiment}
Sentan: ${entry.sentan}
  `,
    )
    .join("\n---\n")
}


let FEEDBACK_DATABASE;

// Updated database structure to match the new data format
// const FEEDBACK_DATABASE = [
//   {
//     '': '99',
//     Date: '18/02/2024',
//     'Sub-Channels': 'Police Clearance Certificate',
//     Comments: 'Thanks',
//     Sentiment: 'Neutral',
//     Sentan: '5'
//   },
//   {
//     '': '100',
//     Date: '19/02/2024',
//     'Sub-Channels': 'Traffic Fine Payment',
//     Comments: 'Very fast and efficient service',
//     Sentiment: 'Positive',
//     Sentan: '5'
//   },
//   {
//     '': '101',
//     Date: '20/02/2024',
//     'Sub-Channels': 'Lost Item Certificate',
//     Comments: 'Process was confusing',
//     Sentiment: 'Negative',
//     Sentan: '2'
//   },
//   {
//     '': '102',
//     Date: '21/02/2024',
//     'Sub-Channels': 'Police Clearance Certificate',
//     Comments: 'Great service, thank you',
//     Sentiment: 'Positive',
//     Sentan: '5'
//   },
//   {
//     '': '103',
//     Date: '22/02/2024',
//     'Sub-Channels': 'Accident Report',
//     Comments: 'The process took too long',
//     Sentiment: 'Negative',
//     Sentan: '2'
//   },
//   {
//     '': '104',
//     Date: '23/02/2024',
//     'Sub-Channels': 'Traffic Fine Payment',
//     Comments: 'Website kept timing out',
//     Sentiment: 'Negative',
//     Sentan: '1'
//   },
//   {
//     '': '105',
//     Date: '24/02/2024',
//     'Sub-Channels': 'Police Clearance Certificate',
//     Comments: 'Process was smooth',
//     Sentiment: 'Positive',
//     Sentan: '4'
//   },
//   {
//     '': '106',
//     Date: '25/02/2024',
//     'Sub-Channels': 'Tourist Police Services',
//     Comments: 'The officer was very helpful',
//     Sentiment: 'Positive',
//     Sentan: '5'
//   },
//   {
//     '': '107',
//     Date: '26/02/2024',
//     'Sub-Channels': 'Bounce Cheque Report',
//     Comments: 'OK',
//     Sentiment: 'Neutral',
//     Sentan: '3'
//   },
//   {
//     '': '108',
//     Date: '27/02/2024',
//     'Sub-Channels': 'Lost Item Certificate',
//     Comments: 'Certificate was issued promptly',
//     Sentiment: 'Positive',
//     Sentan: '4'
//   },
//   {
//     '': '109',
//     Date: '28/02/2024',
//     'Sub-Channels': 'Police Clearance Certificate',
//     Comments: 'Good',
//     Sentiment: 'Positive',
//     Sentan: '4'
//   },
//   {
//     '': '110',
//     Date: '29/02/2024',
//     'Sub-Channels': 'Fine Inquiry & Payment',
//     Comments: 'Could not complete payment',
//     Sentiment: 'Negative',
//     Sentan: '2'
//   },
//   {
//     '': '111',
//     Date: '01/03/2024',
//     'Sub-Channels': 'Accident Report',
//     Comments: 'Took too much time',
//     Sentiment: 'Negative',
//     Sentan: '2'
//   },
//   {
//     '': '112',
//     Date: '02/03/2024',
//     'Sub-Channels': 'Traffic Fine Payment',
//     Comments: 'Easy to use',
//     Sentiment: 'Positive',
//     Sentan: '5'
//   },
//   {
//     '': '113',
//     Date: '03/03/2024',
//     'Sub-Channels': 'Police Clearance Certificate',
//     Comments: 'Efficient service',
//     Sentiment: 'Positive',
//     Sentan: '5'
//   }
// ];

// Helper function to get sentiment color
function getSentimentColor(sentiment) {
  if (sentiment === "Happy") return "#FF0000";
  if (sentiment === "Unhappy") return "#00FF00";
  return "#FFBF00"; // neutral
}

// Helper function to get sentiment message
function getSentimentMessage(sentiment) {
  if (sentiment === "Unhappy")
    return "⚠️ Requires Attention: Consider immediate service improvements";
  if (sentiment === "Happy")
    return "✅ Positive Feedback: Service meeting user expectations";
  return "⚖️ Neutral Feedback: Room for improvement";
}

function getFeedbackByService(serviceName) {
  return FEEDBACK_DATABASE.filter(
    (item) =>
      item["Sub-Channels"].toLowerCase().includes(serviceName.toLowerCase()) ||
      serviceName.toLowerCase() === "all"
  );
}

function extractQueryParameters(userMessage) {
  // Regex patterns for feedback search parameters
  const patterns = {
    service: /(?:service|channel|about):?\s*([^,\.!\?]+)/i,
    sentiment: /(?:sentiment|feeling):?\s*(happy|unhappy|neutral)/i,
    dateRange: /(?:date|period|from):?\s*([^,\.!\?]+)/i,
    rating: /(?:rating|sentan):?\s*([1-5])/i,
  };

  const extractedParams = {};

  // Extract parameters using patterns
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = userMessage.match(pattern);
    if (match) {
      extractedParams[key] = match[1].trim();
    }
  }

  return extractedParams;
}

function searchFeedback(params) {
  let results = [...FEEDBACK_DATABASE];

  // Apply filters based on extracted parameters
  if (params.service && params.service.toLowerCase() !== "all") {
    results = results?.filter((item) =>
      item["Sub-Channels"]?.toLowerCase().includes(params.service.toLowerCase())
    );
  }

  if (params.sentiment) {
    results = results.filter(
      (item) => item.Sentiment.toLowerCase() === params.sentiment.toLowerCase()
    );
  }

  if (params.dateRange) {
    // Simple date handling - could be expanded for more complex date ranges
    results = results.filter((item) => item.Date.includes(params.dateRange));
  }

  if (params.rating) {
    results = results.filter((item) => item.Sentan === params.rating);
  }

  return results;
}

function generateRelatedQuestions(feedbackAnalysis, userMessage) {
  const { queryIntent, requestedMetrics, focusAreas } = feedbackAnalysis;

  const baseQuestions = [];

  if (requestedMetrics.includes("average rating")) {
    baseQuestions.push("How has the average rating changed over time?");
  }

  if (requestedMetrics.includes("sentiment")) {
    baseQuestions.push(
      "What are the most common reasons for negative feedback?"
    );
    baseQuestions.push("Which services received the most positive sentiment?");
  }

  if (
    focusAreas.some(
      (f) =>
        f.toLowerCase().includes("traffic") ||
        f.toLowerCase().includes("accident")
    )
  ) {
    baseQuestions.push(
      "Is there a pattern of negative feedback in Traffic-related services?"
    );
  }

  if (focusAreas.includes("Police Clearance Certificate")) {
    baseQuestions.push(
      "How frequently do users comment on the speed of service for Police Clearance Certificates?"
    );
  }

  // Generic exploratory questions
  baseQuestions.push(
    "Which services need the most improvement based on feedback?"
  );
  baseQuestions.push("What time period had the highest negative sentiment?");
  baseQuestions.push(
    "Are users more satisfied with online or in-person services?"
  );

  return baseQuestions;
}

function calculateFeedbackStats(feedbackItems) {
  if (!feedbackItems || feedbackItems.length === 0) {
    return {
      avgRating: 0,
      sentimentBreakdown: { Happy: 0, Neutral: 0, Unhappy: 0 },
      serviceBreakdown: {},
      totalFeedback: 0,
    };
  }

  const totalFeedback = feedbackItems.length;
  const avgRating =
    feedbackItems.reduce((sum, item) => sum + parseInt(item.Sentan), 0) /
    totalFeedback;

  // Calculate sentiment breakdown
  const sentimentBreakdown = feedbackItems.reduce(
    (acc, item) => {
      acc[item.Sentiment] = (acc[item.Sentiment] || 0) + 1;
      return acc;
    },
    { Happy: 0, Neutral: 0, Unhappy: 0 }
  );

  // Calculate service breakdown
  const serviceBreakdown = feedbackItems.reduce((acc, item) => {
    const service = item["Sub-Channels"];
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  return {
    avgRating: parseFloat(avgRating.toFixed(1)),
    sentimentBreakdown,
    serviceBreakdown,
    totalFeedback,
  };
}

async function processFeedbackQuery(userMessage) {
  const model = lmstudio(MODEL_LLM);
  FEEDBACK_DATABASE = await fetchSheetData();
  // Extract query parameters from user message
  const queryParams = extractQueryParameters(userMessage);

  // Search for relevant feedback
  const relevantFeedback = searchFeedback(queryParams);

  // Calculate feedback statistics
  const feedbackStats = calculateFeedbackStats(relevantFeedback);

  // Step 1: Analyze feedback query
  const { object: queryAnalysis } = await generateObject({
    model,
    schema: z.object({
      queryIntent: z.string(),
      requestedMetrics: z.array(z.string()),
      focusAreas: z.array(z.string()),
      recommendedInsights: z.array(z.string()),
      recommendedQuestions: z.array(z.string()),
    }),
    prompt: `As a CX Feedback assistant for Dubai Police website, Provide clear statistics and summary. analyze this query:
      1. What is the user's intent in analyzing feedback?
      2. What metrics are they interested in?
      3. What focus areas (services, sentiment, time periods) are relevant?
      4. What insights would be most valuable based on this feedback data:
      ${JSON.stringify(relevantFeedback.slice(0, 5), null, 2)}
      
      Full statistics: ${JSON.stringify(feedbackStats, null, 2)}

      User query: ${userMessage}
      5. Based on this feedback data:
   ${JSON.stringify(relevantFeedback.slice(0, 5), null, 2)}
   
   Full statistics: ${JSON.stringify(feedbackStats, null, 2)}

   User query: ${userMessage}

   Suggest 3 relevant follow-up questions a user might ask next. Return them as a JSON array of strings.
`,
  });

  // const relatedQuestions = generateRelatedQuestions(queryAnalysis, userMessage);

  console.log(queryAnalysis, "queryAnalysisqueryAnalysis");

  // Step 2: Generate feedback analysis response
  const { text: initialResponse } = await generateText({
    model,
    messages: [
      {
        role: "system",
        content: `
Hello, I am a CX Feedback AI assistant. You can find information about user's feedback captured from the Dubai Police Website through the Happiness Meter Survey.

Consider this analysis:
- Query intent: ${queryAnalysis.queryIntent}
- Requested metrics: ${queryAnalysis.requestedMetrics.join(", ")}
- Focus areas: ${queryAnalysis.focusAreas.join(", ")}
- Recommended Questions: ${queryAnalysis.recommendedQuestions.join(", ")}
- Recommended insights: ${queryAnalysis.recommendedInsights.join("; ")}

Statistics:
- Average rating: ${feedbackStats.avgRating}/5
- Total feedback: ${feedbackStats.totalFeedback}
- Sentiment: ${JSON.stringify(feedbackStats.sentimentBreakdown)}
- Services: ${JSON.stringify(feedbackStats.serviceBreakdown)}

If applicable, highlight how feedback has changed over time, particularly by month or year. Always respond clearly and focus on insights.

If the user asks who you are, or if it’s their first time interacting, you may introduce yourself as:

"Hello, I am a CX Feedback AI assistant. I help analyze user feedback captured from the Dubai Police Website through the Happiness Meter Survey."

Otherwise, focus directly on providing insightful and concise feedback analysis based on their query.
`,
        //   content: `You are a CX Feedback AI assistant analyzing user feedback from the Dubai Police Website's Happiness Meter Survey. Provide clear statistics and summary.

        //     Consider this analysis:
        //     - Query intent: ${queryAnalysis.queryIntent}
        //     - Requested metrics: ${queryAnalysis.requestedMetrics.join(', ')}
        //     - Focus areas: ${queryAnalysis.focusAreas.join(', ')}
        //     - Recommended Questions: ${queryAnalysis.recommendedQuestions.join(', ')}
        //     - Recommended insights: ${queryAnalysis.recommendedInsights.join('; ')}
        //     -Rec
        //     Statistics:
        //     - Average rating: ${feedbackStats.avgRating}/5
        //     - Total feedback: ${feedbackStats.totalFeedback}
        //     - Sentiment: ${JSON.stringify(feedbackStats.sentimentBreakdown)}
        //     - Services: ${JSON.stringify(feedbackStats.serviceBreakdown)}

        //     Always introduce yourself as "Hello, I am an CX Feedback AI assistant. You can find information about user's feedback captured from the Dubai Police Website through the Happiness Meter Survey".`
      },
      { role: "user", content: userMessage },
    ],
  });
  console.log(initialResponse, "initialResponseinitialResponse");
  // Step 3: Evaluate response quality
  // const { object: qualityCheck } = await generateObject({
  //   model,
  //   schema: z.object({
  //     insightAccuracy: z.number().min(1).max(10),
  //     dataRelevance: z.number().min(1).max(10),
  //     actionability: z.number().min(1).max(10),
  //     includesIntroduction: z.boolean(),
  //   }),
  //   prompt: `Evaluate this feedback analysis response for:
  //     1. Insight accuracy (1-10)
  //     2. Data relevance to query (1-10)
  //     3. Actionability of insights (1-10)
  //     4. Presence of proper introduction as a CX Feedback AI assistant

  //     Response to evaluate: ${initialResponse}`,
  // });

  // console.log(qualityCheck,"qualityCheckqualityCheck");

  // Step 4: Improve response if needed

  return {
    response: initialResponse,
    analysis: {
      queryIntent: queryAnalysis.queryIntent,
      requestedMetrics: queryAnalysis.requestedMetrics,
      focusAreas: queryAnalysis.focusAreas,
      recommendedQuestions: queryAnalysis.recommendedQuestions,
      feedbackStats,
      // relevantFeedback: relevantFeedback.slice(0, 10), // Limit to first 10 items
      // relatedQuestions,
      // sentimentColors: {
      //   Positive: getSentimentColor('Positive'),
      //   Neutral: getSentimentColor('Neutral'),
      //   Negative: getSentimentColor('Negative')
      // },
      // dominantSentiment: Object.entries(feedbackStats.sentimentBreakdown)
      //   .reduce((a, b) => a[1] > b[1] ? a : b)[0]
    },
    // qualityMetrics: qualityCheck,
    improved: false,
  };

  // if (
  //   qualityCheck.insightAccuracy < 8 ||
  //   qualityCheck.dataRelevance < 7 ||
  //   qualityCheck.actionability < 7 ||
  //   !qualityCheck.includesIntroduction
  // ) {
  //   const { text: improvedResponse } = await generateText({
  //     model,
  //     messages: [
  //       {
  //         role: 'system',
  //         content: `Improve this feedback analysis response with:
  //           ${qualityCheck.insightAccuracy < 8 ? '- More accurate insights based on data' : ''}
  //           ${qualityCheck.dataRelevance < 7 ? '- More relevant data points to query' : ''}
  //           ${qualityCheck.actionability < 7 ? '- More actionable recommendations' : ''}
  //           ${!qualityCheck.includesIntroduction ? '- Add proper introduction as CX Feedback AI assistant' : ''}

  //           Original response: ${initialResponse}`
  //       },
  //       { role: 'user', content: userMessage }
  //     ],
  //   });

  //   return {
  //     response: improvedResponse,
  //     analysis: {
  //       queryIntent: queryAnalysis.queryIntent,
  //       requestedMetrics: queryAnalysis.requestedMetrics,
  //       focusAreas: queryAnalysis.focusAreas,
  //       feedbackStats,
  //       relevantFeedback: relevantFeedback.slice(0, 10), // Limit to first 10 items
  //       sentimentColors: {
  //         Positive: getSentimentColor('Positive'),
  //         Neutral: getSentimentColor('Neutral'),
  //         Negative: getSentimentColor('Negative')
  //       },
  //       dominantSentiment: Object.entries(feedbackStats.sentimentBreakdown)
  //         .reduce((a, b) => a[1] > b[1] ? a : b)[0]
  //     },
  //     qualityMetrics: qualityCheck,
  //     improved: true
  //   };
  // }

  // return {
  //   response: initialResponse,
  //   analysis: {
  //     queryIntent: queryAnalysis.queryIntent,
  //     requestedMetrics: queryAnalysis.requestedMetrics,
  //     focusAreas: queryAnalysis.focusAreas,
  //     feedbackStats,
  //     relevantFeedback: relevantFeedback.slice(0, 10), // Limit to first 10 items
  //     sentimentColors: {
  //       Positive: getSentimentColor('Positive'),
  //       Neutral: getSentimentColor('Neutral'),
  //       Negative: getSentimentColor('Negative')
  //     },
  //     dominantSentiment: Object.entries(feedbackStats.sentimentBreakdown)
  //       .reduce((a, b) => a[1] > b[1] ? a : b)[0]
  //   },
  //   qualityMetrics: qualityCheck,
  //   improved: false
  // };
}

// Allow streaming responses up to 30 seconds

async function enhancedRetrieveContext(userQuery, limit = 5) {
  const { text: enhancedQuery } = await generateText({
    model: lmstudio(MODEL_LLM),
    prompt: `
Extract and expand the key search concepts from this user query. 
Do not add fictional details, but include synonyms and related terms.
Keep your response focused and under 3 sentences.

User query: "${userQuery}"

Enhanced search query:`,
  });
  
  console.log(`Original query: "${userQuery}"`);
  console.log(`Enhanced query: "${enhancedQuery}"`);
  
  // Use both the original and enhanced queries
  const originalResults = await retrieveContext(userQuery, Math.ceil(limit/2));
  const enhancedResults = await retrieveContext(enhancedQuery, Math.ceil(limit/2));
  
  // Combine and deduplicate results (using entry.id as unique identifier)
  const combinedEntries = [...originalResults, ...enhancedResults];
  const uniqueEntries = Array.from(new Set(combinedEntries));
  
  return uniqueEntries.slice(0, limit);
}


export async function generateDatabaseStatistics() {

  const db = new Database(dbPath)

  const database = db.prepare("SELECT * FROM entries").all()
  // Step 1: Extract key metrics from database
  const totalEntries = database.length;
  const subChannels = {};
  const sentiments = {};
  const sentimentScores = { high: 0, medium: 0, low: 0 };
  const subChannelWithSentiment = {};
  
  // Step 2: Analyze database for sub-channels and sentiments
  for (const entry of database) {
    const subChannel = entry.sub_channels;
    const sentiment = entry.sentiment;
    const sentimentScore = parseInt(entry.sentan);
    // console.log(entry.subChannel,"sdfnjsfnj");
    
    // Track sub-channels
    if (!subChannels[subChannel]) {
      subChannels[subChannel] = 0;
      subChannelWithSentiment[subChannel] = {};
    }
    subChannels[subChannel]++;
    
    // Track sentiment text categories
    if (!sentiments[sentiment]) {
      sentiments[sentiment] = 0;
      
      // Initialize sentiment counters for this sub-channel
      if (!subChannelWithSentiment[subChannel][sentiment]) {
        subChannelWithSentiment[subChannel][sentiment] = 0;
      }
    }
    sentiments[sentiment]++;
    subChannelWithSentiment[subChannel][sentiment] = 
      (subChannelWithSentiment[subChannel][sentiment] || 0) + 1;
    
    // Track sentiment scores
    if (sentimentScore >= 4) {
      sentimentScores.high++;
    } else if (sentimentScore >= 2) {
      sentimentScores.medium++;
    } else {
      sentimentScores.low++;
    }
  }
  
  // Step 3: Calculate percentages and generate insights
  const subChannelPercentages = {};
  Object.keys(subChannels).forEach(subChannel => {
    subChannelPercentages[subChannel] = (subChannels[subChannel] / totalEntries * 100).toFixed(2);
  });
  
  const sentimentPercentages = {};
  Object.keys(sentiments).forEach(sentiment => {
    sentimentPercentages[sentiment] = (sentiments[sentiment] / totalEntries * 100).toFixed(2);
  });
  
  // Step 4: Generate prompt with statistical insights
  const statisticsPrompt = `
    Based on the analysis of our database with ${totalEntries} entries:
    
    Sub-Channel Distribution:
    ${Object.keys(subChannels).map(subChannel => 
      `- ${subChannel}: ${subChannels[subChannel]} entries (${subChannelPercentages[subChannel]}%)`
    ).join('\n')}
    
    Sentiment Distribution:
    ${Object.keys(sentiments).map(sentiment => 
      `- ${sentiment}: ${sentiments[sentiment]} entries (${sentimentPercentages[sentiment]}%)`
    ).join('\n')}
    
    Sentiment Score Distribution:
    - High (4-5): ${sentimentScores.high} entries (${(sentimentScores.high / totalEntries * 100).toFixed(2)}%)
    - Medium (2-3): ${sentimentScores.medium} entries (${(sentimentScores.medium / totalEntries * 100).toFixed(2)}%)
    - Low (0-1): ${sentimentScores.low} entries (${(sentimentScores.low / totalEntries * 100).toFixed(2)}%)
    
    Sub-Channel Sentiment Breakdown:
    ${Object.keys(subChannelWithSentiment).map(subChannel => 
      `- ${subChannel}:
        ${Object.keys(subChannelWithSentiment[subChannel]).map(sentiment => 
          `* ${sentiment}: ${subChannelWithSentiment[subChannel][sentiment]} (${(subChannelWithSentiment[subChannel][sentiment] / subChannels[subChannel] * 100).toFixed(2)}%)`
        ).join('\n        ')}`
    ).join('\n')}
    
    When retrieving results from the database, prioritize results according to these patterns:
    1. The most common Sub-Channel is "${Object.keys(subChannels).reduce((a, b) => subChannels[a] > subChannels[b] ? a : b)}" (${subChannelPercentages[Object.keys(subChannels).reduce((a, b) => subChannels[a] > subChannels[b] ? a : b)]}% of entries)
    2. The most common sentiment is "${Object.keys(sentiments).reduce((a, b) => sentiments[a] > sentiments[b] ? a : b)}" (${sentimentPercentages[Object.keys(sentiments).reduce((a, b) => sentiments[a] > sentiments[b] ? a : b)]}% of entries)
    3. ${sentimentScores.high} out of ${totalEntries} entries (${(sentimentScores.high / totalEntries * 100).toFixed(2)}%) have high sentiment scores (4-5)
    
    Please provide results that reflect these statistical patterns while maintaining relevance to the user's query, with special attention to sentiment patterns across different Sub-Channels.
  `;
  
  return statisticsPrompt;
}

async function getContext(query, nResults = 200) {
  const response = await fetch('http://localhost:1111/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      n_results: nResults,
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}





export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();


  const response =  streamText({
    model: lmstudio(MODEL_LLM),
    messages,
    system: `You are Dubai Police Feedback Analyst, a specialized assistant that analyzes citizen feedback to improve police services. Respond in plain English. Do not use XML-style tags like <think> or <|im_start|>.

You analyze citizen feedback to improve police services using structured data (Comments column).

Core Functions:
- Analyze feedback trends, themes, sentiment patterns, and actionable insights

Process:
1. First use getInformation to retrieve relevant feedback data
2. Then use analyzeComments to categorize and analyze the feedback

Tools:
- getInformation: Retrieves feedback data from the database
- analyzer: if user want to report bug then call this tool which Categorizes comments as bugs, UI issues, suggestions, complaints, etc.

Response Style:
- Provide exactly what's requested (e.g., if 2 suggestions asked, give exactly 2)
- Be direct and concise - focus only on key insights
- Use specific data points from retrieved feedback
- Format appropriately for the question type
- Never fabricate data - acknowledge limitations clearly



`,
    tools: {
      // addResource: tool({
      //   description: `add a resource to your knowledge base.
      //     If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
      //   parameters: z.object({
      //     content: z
      //       .string()
      //       .describe("the content or resource to add to the knowledge base"),
      //     metadata: z
      //       .record(z.any())
      //       .optional()
      //       .describe("optional metadata for the resource"),
      //   }),
      //   execute: async ({ content, metadata }) => {
      //     console.log("calling tool1");
      //     for (const doc of documents) {
      //       await addDocument(doc);
      //     }
      //   },
      // }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe("the users question"),
          similarQuestions: z.array(z.string()).describe("keywords to search"),
        }),
        execute: async ({ similarQuestions, question }) => {
        
          // for (const doc of documents) {
          //   await addDocument(doc);
          // }
          
          // const relevantDocs = await retrieveContext(question);
          const relevantDocs=await getContext(question,100)
          const context = relevantDocs?.results?.filter(doc => doc.similarity > 0.5)?.map(doc => `Sub-Channels: ${doc.metadata["Sub-Channels"]} Comment:${doc.metadata.Comments}`).join("\n\n");
          // const context = relevantDocs?.results?.map(doc => doc.content).join("\n\n");
          // const relevantDocs = await findSimilarDocuments(question);
console.log(context,"contextcontextcontextcontextcontext");

          if (context.length === 0) {
            throw new Error(
              "No documents found in the knowledge base. Please add some documents first."
            );
          }

          // Create context from relevant documents
          // const context = relevantDocs.join("\n\n");
          // console.log(context, "sdfsdf");
       
          const result = await generateText({
            model: lmstudio(MODEL_LLM),
            prompt: `
You are a helpful assistant that answers questions based on the provided context.

CONTEXT:
${context}

QUESTION:
${question}

Please answer the question based only on the provided context. If the context doesn't contain the information needed to answer the question, say so.

ANSWER:`,
            maxRetries: 1,
          });
          // console.log(result,"calling tool2");
          return result.text;
        },
      }),
      // analyzeComments: tool({
      //   description: `Analyze comments to categorize them as bugs, UI issues, suggestions, complaints, or other feedback types.`,
      //   parameters: z.object({
      //     comments: z.array(
      //       z.object({
      //         comment: z.string().describe("the comment text to analyze"),
      //       })
      //     ).describe("array of comments to analyze"),
      //   }),
      //   execute: async ({ comments }) => {
      //     const { object } = await generateObject({
      //       model: MODEL_LLM, // Ensure this is a valid model identifier for your setup
      //       system: "You are a feedback classifier for technical issues and user sentiment.",
      //       schema: z.array(
      //         z.object({
      //           comment: z.string(),
      //           type: z.enum(["BUG", "UI_ISSUE", "SUGGESTION", "CONFUSION", "COMPLAINT", "GENERAL"]),
      //           priority: z.optional(z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])),
      //           sentiment: z.enum(["ANGRY", "CONFUSED", "SATISFIED", "NEUTRAL", "FRUSTRATED"]),
      //           summary: z.string().max(100),
      //           requiresTicket: z.boolean(),
      //         })
      //       ),
      //       prompt: `Analyze and classify this array of comments:
      //       ${JSON.stringify(comments)}
            
      //       For each comment, determine if it's reporting a bug, UI issue, making a suggestion, showing confusion, or expressing a complaint.
      //       For bugs and UI issues, set requiresTicket to true and assign a priority. For other types, set requiresTicket to false and you can leave priority undefined.`,
      //     });
      
      //     return object;
      //   },
      // }),
      
      // insightRetrieval: tool({
      //   description: `call this tool if user ask for insight or statistics based questions`,
      //   parameters: z.object({
      //     query: z.string().describe("the users query"),
      //   }),
      //   execute: async ({ query }) => {
      //     console.log("calling insight tools");
      //     const systemP=await generateDatabaseStatistics()


      //     const result = await generateText({
      //       model: lmstudio(MODEL_LLM),
      //       system:
      //         "You are a query understanding assistant. Analyze the user query and generate data statistics.",
      //       prompt: `Analyze this query: "${query}" answers questions based on the provided context.
      //       CONTEXT:
      //       ${systemP} `,
      //     });
      //     return result;
      //   },
      // }),
      analyzer: tool({
        description: `Analyze comments to categorize them as bugs, UI issues, suggestions, complaints, or other feedback types.`,
        parameters: z.object({
          comments: z.array(z.string().describe("the comment text to analyze")).describe("array of comments to analyze"),
        }),
        execute: async ({ comments }) => {
        
          const { object:anlyzeObject } = await generateObject({
            model: lmstudio(MODEL_LLM),
            system:
              "You are a feedback classifier for technical issues and user sentiment.",
              schema:z.object({
                results: z.array(
                  z.object({
                    comment: z.string(),
                    type: z.enum([
                      "BUG",
                      "UI_ISSUE",
                      "SUGGESTION",
                      "CONFUSION",
                      "COMPLAINT",
                      "GENERAL",
                    ]),
                    priority: z.optional(z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])), // only for BUG or UI_ISSUE
                    summary: z.string().max(100),
                    sentiment: z.enum([
                      "ANGRY",
                      "CONFUSED",
                      "SATISFIED",
                      "NEUTRAL",
                      "FRUSTRATED",
                    ]),
                    requiresTicket: z.boolean(),
                  })
                ),
              }),
            prompt: `You are a feedback analyzer.

Below is an array of raw user comments. Your job is to analyze and classify them into a structured JSON format based on the following schema:

{
  results: [
    {
      comment: string,
      type: one of: "BUG", "UI_ISSUE", "SUGGESTION", "CONFUSION", "COMPLAINT", "GENERAL",
      summary: a short summary of the issue (max 100 characters),
      sentiment: one of: "ANGRY", "CONFUSED", "SATISFIED", "NEUTRAL", "FRUSTRATED",
      requiresTicket: true or false,
      priority: optional, only included if type is "BUG" or "UI_ISSUE"
                value must be one of: "LOW", "MEDIUM", "HIGH", "CRITICAL"
    }
  ]
}

Rules:
- Always return a **valid JSON object** with a top-level 'results' array.
- For 'BUG' or 'UI_ISSUE':
  - Set 'requiresTicket' to true.
  - Include a valid 'priority' value.
- For all other types:
  - Set 'requiresTicket' to false.
  - Do **not** include 'priority' at all.
- 'summary' must be no longer than 100 characters.
- Do **not** add any explanation or non-JSON content — only return the JSON object.

Input comments:

${JSON.stringify(comments)}
`,
          });
          console.log(anlyzeObject,anlyzeObject,"calling tool4444");
          return  anlyzeObject.results;
        },
      }),
    },
 maxSteps:4
 
  });

  // for await (const textPart of textStream) {
  //   process.stdout.write(textPart);
  // }
  // return  textStream.toDataStreamResponse();

  return response.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
}


export function errorHandler(error) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}