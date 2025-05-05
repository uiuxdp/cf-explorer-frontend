// import { fetchSheetData } from "@/lib/utils";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText, streamText } from "ai"
// import { createClient } from "@libsql/client"
// import { searchDocuments } from "@/lib/search"
// import { processAttachment } from "@/lib/process-document"
import { MODEL_LLM } from "@/lib/constants"
import { createEmbedding, findSimilarDocuments } from "@/app/rag/actions"
// Create a custom provider for LM Studio
// LM Studio uses port 1234 by default
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
})


export const runtime = 'edge';

export async function POST(req) {

  const { messages } = await req.json()
  const query = messages[messages.length - 1].content
  debugger

  try {
    // Find relevant documents
    const relevantDocs = await findSimilarDocuments(query)
    console.log(relevantDocs,"queryqueryqueryquery");
    if (relevantDocs.length === 0) {
      throw new Error("No documents found in the knowledge base. Please add some documents first.")
    }

    // Create context from relevant documents
    const context = relevantDocs.join("\n\n")
    console.log(`Using ${relevantDocs.length} chunks for context`)

    // Generate text with context
    const modelName = MODEL_LLM // Replace with your actual model name

    const result =  streamText({
      model: lmstudio(modelName),
       messages,
    system: `
You are a helpful assistant that answers questions based on the provided context.

CONTEXT:
${context}

QUESTION:
${query}

Please answer the question based only on the provided context. If the context doesn't contain the information needed to answer the question, say so.

ANSWER:`,
      maxRetries: 1,
    })

    // return result.text
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error generating content with RAG:", error)
    throw error
  }
    // Process any attachments if present
   
}
