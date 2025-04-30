import {
  addDocument,
  createEmbedding,
  findSimilarDocuments,
} from "@/app/rag/actions";
import { fetchSheetData } from "@/lib/utils";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, generateObject, streamText, tool, embed } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server"
import  Database  from "better-sqlite3"
import path from "path"

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: 'http://localhost:1234/v1',
  // baseURL: "http://10.90.115.142:1234/v1",
  maxRetries: 4, // immediately error if the server is not running
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
    const embeddingModelName = "text-embedding-nomic-embed-text-v1.5" // Replace with your actual model

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


function cosineSimilarity(a, b) {


  console.log(a.length , b.length,"cosineSimilaritycosineSimilarity");
  

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
async function retrieveContext(query, limit = 10) {

  const db = new Database(dbPath)

  // Get query embedding
  const queryEmbedding = await embedText(query)


  // Get all entries
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
  console.log(entriesWithSimilarity,`Entryyyy`);
  // Sort by similarity and get top results
  const topEntries = entriesWithSimilarity.sort((a, b) => b.similarity - a.similarity).slice(0, limit)

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





// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();

  const result = streamText({
    model: lmstudio("qwen2.5-7b-instruct"),
    messages,
    system: `You are Dubai police feedback assistant, a helpful feedback analyzing assistant that interprets user queries.
The CSV includes columns: id, Date, Sub-Channels, Comments, Sentiment, and Sentan.
Sentiment values include: Happy, Unhappy, and Neutral.

Use tools for every user request.

Always use the getInformation tool to retrieve insights from the feedback data before answering.

If the user provides additional context or data, store it using the addResource tool.

If the response requires chaining tools, do so in order without responding until all relevant data is gathered.

Only respond based on retrieved tool information. If no relevant data is found, respond with: "Sorry, I don't know."

Always follow instructions included in tool responses.

Be concise. Responses should be short, ideally one sentence.

You can use logic and common sense to deduce answers based on available data.

Users can ask questions filtered by Date, Sub-Channel, Comment, Sentiment, or review-specific insights.
`,
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
          metadata: z
            .record(z.any())
            .optional()
            .describe("optional metadata for the resource"),
        }),
        execute: async ({ content, metadata }) => {
          console.log("calling tool1");
          for (const doc of documents) {
            await addDocument(doc);
          }
        },
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe("the users question"),
          similarQuestions: z.array(z.string()).describe("keywords to search"),
        }),
        execute: async ({ similarQuestions, question }) => {
        
         
          
          const relevantDocs = await retrieveContext(question);

          if (relevantDocs.length === 0) {
            throw new Error(
              "No documents found in the knowledge base. Please add some documents first."
            );
          }

          // Create context from relevant documents
          // const context = relevantDocs.join("\n\n");
          // console.log(context, "sdfsdf");
       
          const result = await generateText({
            model: lmstudio("qwen2.5-7b-instruct"),
            prompt: `
You are a helpful assistant that answers questions based on the provided context.

CONTEXT:
${relevantDocs}

QUESTION:
${question}

Please answer the question based only on the provided context. If the context doesn't contain the information needed to answer the question, say so.

ANSWER:`,
            maxRetries: 1,
          });
          console.log(result,"calling tool2");
          return result;
        },
      }),
      // understandQuery: tool({
      //   description: `understand the users query. use this tool on every prompt.`,
      //   parameters: z.object({
      //     query: z.string().describe("the users query"),
      //     toolsToCallInOrder: z
      //       .array(z.string())
      //       .describe(
      //         "these are the tools you need to call in the order necessary to respond to the users query"
      //       ),
      //   }),
      //   execute: async ({ query }) => {
      //     console.log("calling tool3");
      //     const { object } = await generateObject({
      //       model: lmstudio("qwen2.5-7b-instruct"),
      //       system:
      //         "You are a query understanding assistant. Analyze the user query and generate similar questions.",
      //       schema: z.object({
      //         questions: z
      //           .array(z.string())
      //           .max(3)
      //           .describe("similar questions to the user's query. be concise."),
      //       }),
      //       prompt: `Analyze this query: "${query}". Provide the following:
      //               3 similar questions that could help answer the user's query`,
      //     });
      //     return object.questions;
      //   },
      // }),
    },
  });

  return result.toDataStreamResponse({
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