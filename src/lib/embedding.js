"use server"

import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { embed, embedMany, cosineSimilarity } from "ai"
import db from "@/lib/db"

// Create LM Studio provider
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
})

// Chunk text into smaller pieces
export async function chunkText(text, maxChunkSize = 1000) {
  // Simple chunking by paragraphs first
  const paragraphs = text.split(/\n\s*\n/)

  const chunks = []
  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = ""
    }

    // If a single paragraph is too large, split it by sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/)

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim())
          currentChunk = ""
        }
        currentChunk += sentence + " "
      }
    } else {
      currentChunk += paragraph + "\n\n"
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// Generate embeddings for multiple chunks
export async function generateEmbeddings(chunks) {
  try {
    // Use the embedding model from LM Studio
    // Note: Make sure you have an embedding model loaded in LM Studio
    const { embeddings } = await embedMany({
      model: lmstudio.embedding("text-embedding-nomic-embed-text-v1.5"),
      values: chunks,
      maxRetries: 1, // Immediately error if the server is not running
    })

    return chunks.map((content, i) => ({
      content,
      embedding: embeddings[i],
    }))
  } catch (error) {
    console.error("Error generating embeddings:", error)
    throw new Error("Failed to generate embeddings. Make sure LM Studio server is running.")
  }
}

export async function searchSimilarChunks(query, limit = 5) {
  try {
    // Generate embedding for the query
    const { embedding } = await embed({
      model: lmstudio.embedding("text-embedding-nomic-embed-text-v1.5"),
      value: query,
      maxRetries: 1, // Immediately error if the server is not running
    })

    // Get all embeddings from the database
    const rows = db
      .prepare(`
      SELECT 
        c.id as chunk_id, 
        c.document_id, 
        c.content, 
        e.embedding,
        d.title as document_title
      FROM embeddings e
      JOIN chunks c ON e.chunk_id = c.id
      JOIN documents d ON c.document_id = d.id
    `)
      .all()

    // Calculate similarity for each embedding
    const results = rows.map((row) => {
      // Convert Buffer back to Float32Array
      const buffer = row.embedding
      const embeddingArray = Array.from(
        new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)),
      )

      return {
        id: row.chunk_id,
        documentId: row.document_id,
        documentTitle: row.document_title,
        content: row.content,
        similarity: cosineSimilarity(embedding, embeddingArray),
      }
    })

    // Sort by similarity (highest first) and take the top results
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  } catch (error) {
    console.error("Error searching for similar chunks:", error)
    return []
  }
}
