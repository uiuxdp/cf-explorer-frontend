import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { streamText } from "ai"
import { createClient } from "@libsql/client"
import { searchDocuments } from "@/lib/search"
import { processAttachment } from "@/lib/process-document"
import { MODEL_LLM } from "@/lib/constants"

// Create LM Studio client
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
})

// Create database client
const db = createClient({
  url: process.env.BETTER_SQL_URL || "file:local.db",
  authToken: "process.env.BETTER_SQL_AUTH_TOKEN",
})
export const runtime = 'edge';
export async function POST(req) {
  try {
    const { messages, experimental_attachments } = await req.json()

    // Process any attachments if present
    if (experimental_attachments && experimental_attachments.length > 0) {
      for (const attachment of experimental_attachments) {
        await processAttachment(attachment, db, lmstudio)
      }

      // Return a confirmation message
      return new Response(
        JSON.stringify({
          role: "assistant",
          content:
            "I've processed your document and added it to my knowledge base. You can now ask questions about it!",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1].content

    // Search for relevant documents based on the user's query
    const relevantDocuments = await searchDocuments(userMessage, db, lmstudio)

    // Create a system message with the relevant context
    console.log(relevantDocuments,"relevantDocuments");
    
    const systemMessage =
      relevantDocuments.length > 0
        ? `You are a helpful assistant. Use the following information to answer the user's question:\n\n${relevantDocuments.join("\n\n")}`
        : "You are a helpful assistant."

    // Generate a response using LM Studio
    const result = streamText({
      model: lmstudio(MODEL_LLM),
      messages,
      system: systemMessage,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "An error occurred during processing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
