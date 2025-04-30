import { fetchSheetData } from "@/lib/utils";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText, streamText } from "ai"

// Create a custom provider for LM Studio
// LM Studio uses port 1234 by default
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
})

export async function POST(req) {
  const { messages } = await req.json()
  const context = await fetchSheetData();
  console.log(context,"contextcontextcontextcontext");
  
  const systemMessage = `You are a helpful assistant that answers questions based on the provided context. 
    
  Context:
  ${context}
  
  Answer the user's question based on the context provided. If the answer is not in the context, say "I don't have enough information to answer that question."`

  const result = streamText({
    model: lmstudio("qwen2.5-7b-instruct"), 
    // messages: [{ role: "system", content: systemMessage }, ...messages],
    messages
  })

  // Return the stream response
  return result.toDataStreamResponse()
}
