"use server"

import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"

// Create LM Studio provider
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
})

export async function generateAnswer(question, context) {
  try {
    // Use your local LM Studio model
    // Replace 'llama-3.2-1b' with the model you have loaded in LM Studio
    const { text } = await generateText({
      model: lmstudio("llama-3.2-1b"),
      prompt: question,
      system: `You are a helpful assistant that answers questions based on the provided context. 
      If the answer cannot be found in the context, say that you don't know based on the available information.
      
      Context:
      ${context}`,
      maxRetries: 1, // Immediately error if the server is not running
    })

    return text
  } catch (error) {
    console.error("Error generating answer:", error)
    return "Sorry, I encountered an error while generating an answer. Make sure LM Studio server is running."
  }
}
