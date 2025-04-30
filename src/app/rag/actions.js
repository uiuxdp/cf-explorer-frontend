"use server"

import { generateText } from "ai"
import { embed } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

// Create a provider instance for LM Studio
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
//   baseURL: "http://10.90.115.142:1234/v1", // Default LM Studio port
  baseURL: "http://localhost:1234/v1", // Default LM Studio port
})

// In a real application, you would use a vector database
// For simplicity, we'll use an in-memory store


// Our simple "database"
const documents = []


// Function to create an embedding for text
 async function createEmbedding(text) {
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

// Add a document to our "database"
export async function addDocument(text) {
  try {
    const embedding = await createEmbedding(text)

    // Check if document already exists (to avoid duplicates)
    const exists = documents.some((doc) => doc.text === text)
    if (!exists) {
      documents.push({ text, embedding })
    }
  } catch (error) {
    console.error("Error adding document:", error)
    throw error
  }
}

// Find the most similar documents to a query
export async function findSimilarDocuments(query, topK = 3) {
  try {
    // If no documents, return empty array
    if (documents.length === 0) {
      return []
    }

    const queryEmbedding = await createEmbedding(query)

    // Calculate similarity scores
    const similarities = documents.map((doc) => ({
      text: doc.text,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }))

    // Sort by similarity score (highest first)
    similarities.sort((a, b) => b.score - a.score)

    // Return top K documents
    return similarities.slice(0, topK).map((item) => item.text)
  } catch (error) {
    console.error("Error finding similar documents:", error)
    throw error
  }
}

// Generate content using RAG
export async function generateContentWithRAG(query) {
  try {
    // Find relevant documents
    const relevantDocs = await findSimilarDocuments(query)

    if (relevantDocs.length === 0) {
      throw new Error("No documents found in the knowledge base. Please add some documents first.")
    }

    // Create context from relevant documents
    const context = relevantDocs.join("\n\n")
console.log(context,"contextcontextcontext");

    // Generate text with context
    const modelName ='qwen2.5-7b-instruct'// Replace with your actual model name

    const result = await generateText({
      model: lmstudio(modelName),
      prompt: `
You are a helpful assistant that answers questions based on the provided context.

CONTEXT:
${context}

QUESTION:
${query}

Please answer the question based only on the provided context. If the context doesn't contain the information needed to answer the question, say so.

ANSWER:`,
      maxRetries: 1,
    })

    return result.text
  } catch (error) {
    console.error("Error generating content with RAG:", error)
    throw error
  }
}

// Helper function to calculate cosine similarity
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
