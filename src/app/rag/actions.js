"use server"

import { generateText } from "ai"
import { embed } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { MODEL_EMBED, MODEL_LLM } from "@/lib/constants"
import { kv } from "@vercel/kv"  // For permanent storage option
// Or for local storage:
// import fs from 'fs'
// import path from 'path'

// Create a provider instance for LM Studio
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1", // Default LM Studio port
})

// Solution 1: Use a database (Vercel KV in this example)
async function getDocuments() {
  try {
    const docs = await kv.get('rag_documents') || []
    return docs
  } catch (error) {
    console.error("Error fetching documents:", error)
    return []
  }
}

async function saveDocuments(docs) {
  try {
    await kv.set('rag_documents', docs)
  } catch (error) {
    console.error("Error saving documents:", error)
  }
}

// Solution 2 (Alternative): Store documents in a local file
// Uncomment if you want to use local file storage instead
/*
const DOCS_FILE_PATH = path.join(process.cwd(), 'data', 'documents.json')

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  fs.mkdirSync(dirname, { recursive: true })
}

async function getDocuments() {
  try {
    ensureDirectoryExistence(DOCS_FILE_PATH)
    if (!fs.existsSync(DOCS_FILE_PATH)) {
      fs.writeFileSync(DOCS_FILE_PATH, JSON.stringify([]))
      return []
    }
    const data = fs.readFileSync(DOCS_FILE_PATH, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading documents file:", error)
    return []
  }
}

async function saveDocuments(docs) {
  try {
    ensureDirectoryExistence(DOCS_FILE_PATH)
    fs.writeFileSync(DOCS_FILE_PATH, JSON.stringify(docs, null, 2))
  } catch (error) {
    console.error("Error saving documents file:", error)
  }
}
*/

// Function to create an embedding for text
async function createEmbedding(text) {
  try {
    // Use an embedding model from LM Studio
    const embeddingModelName = MODEL_EMBED

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

// Function to chunk text into smaller pieces
function chunkText(text, maxChunkSize = 1000) {
  // For CSV files, try to keep rows together
  if (text.includes(",") && text.includes("\n")) {
    return chunkCSV(text, maxChunkSize)
  }

  // For other text (including PDF content)
  return chunkGenericText(text, maxChunkSize)
}

// Chunk CSV data by preserving rows
function chunkCSV(csvText, maxChunkSize) {
  const rows = csvText.split("\n")
  const header = rows[0] // Preserve the header for each chunk

  const chunks = []
  let currentChunk = header
  let currentSize = header.length

  // Start from row 1 (after header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    // If adding this row would exceed the chunk size, start a new chunk
    if (currentSize + row.length + 1 > maxChunkSize && currentChunk !== header) {
      chunks.push(currentChunk)
      currentChunk = header + "\n" + row
      currentSize = header.length + row.length + 1
    } else {
      currentChunk += "\n" + row
      currentSize += row.length + 1
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk !== header) {
    chunks.push(currentChunk)
  }

  return chunks
}

// Chunk generic text by sentences or paragraphs
function chunkGenericText(text, maxChunkSize) {
  // Try to split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/)

  const chunks = []
  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If the paragraph itself is too large, split it by sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/)

      for (const sentence of sentences) {
        // If adding this sentence would exceed the chunk size, start a new chunk
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = sentence
        } else {
          // Add a space if the current chunk is not empty
          if (currentChunk.length > 0) {
            currentChunk += " "
          }
          currentChunk += sentence
        }
      }
    } else {
      // If adding this paragraph would exceed the chunk size, start a new chunk
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = paragraph
      } else {
        // Add a newline if the current chunk is not empty
        if (currentChunk.length > 0) {
          currentChunk += "\n\n"
        }
        currentChunk += paragraph
      }
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

// Add a document to our database with chunking
export async function addDocument(text) {
  try {
    // Skip empty documents
    if (!text || text.trim() === "") {
      return
    }

    // Get existing documents
    const documents = await getDocuments()

    // Chunk the document into smaller pieces
    const chunks = chunkText(text)
    console.log(`Document split into ${chunks.length} chunks`)

    // Process each chunk
    for (const chunk of chunks) {
      // Check if chunk already exists (to avoid duplicates)
      const exists = documents.some((doc) => doc.text === chunk)
      if (!exists) {
        const embedding = await createEmbedding(chunk)
        documents.push({
          text: chunk,
          embedding,
          // Store metadata about the original document if needed
          metadata: {
            originalLength: text.length,
            chunkCount: chunks.length,
            timestamp: new Date().toISOString()
          },
        })
      }
    }

    // Save updated documents
    await saveDocuments(documents)

    return { chunkCount: chunks.length }
  } catch (error) {
    console.error("Error adding document:", error)
    throw error
  }
}

// Find the most similar documents to a query
export async function findSimilarDocuments(query, topK = 5) {
  
  try {
    // Get documents from storage
    const documents = await getDocuments()
    console.log(`Found ${documents.length} documents in storage`)
    
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
    console.log(`Using ${relevantDocs.length} chunks for context`)

    // Generate text with context
    const modelName = MODEL_LLM

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

// For development/debugging: Clear all documents
export async function clearAllDocuments() {
  try {
    await saveDocuments([])
    return { success: true, message: "All documents cleared" }
  } catch (error) {
    console.error("Error clearing documents:", error)
    throw error
  }
}

// For development/debugging: Get document count
export async function getDocumentCount() {
  try {
    const documents = await getDocuments()
    return { count: documents.length }
  } catch (error) {
    console.error("Error getting document count:", error)
    throw error
  }
}