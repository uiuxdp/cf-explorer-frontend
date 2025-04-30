"use server"

import { nanoid } from "@/lib/utils"
import db from "@/lib/db"
import { chunkText, generateEmbeddings, searchSimilarChunks } from "@/lib/embedding"
// import { generateAnswer, streamAnswer } from "@/lib/ai"

export async function processDocument(title, content) {
  // Generate a unique ID for the document
  const documentId = nanoid()

  // Insert the document into the database
  db.prepare("INSERT INTO documents (id, title, document_type) VALUES (?, ?, ?)").run(documentId, title, "text")

  // Chunk the document
  const chunks = chunkText(content)

  // Process chunks in batches to avoid memory issues
  const batchSize = 100
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize)

    // Generate embeddings for the batch
    const embeddingsData = await generateEmbeddings(batchChunks)

    // Insert chunks and embeddings
    const insertChunk = db.prepare("INSERT INTO chunks (id, document_id, content) VALUES (?, ?, ?)")
    const insertEmbedding = db.prepare("INSERT INTO embeddings (id, chunk_id, embedding) VALUES (?, ?, ?)")

    const transaction = db.transaction((items) => {
      for (const item of items) {
        const chunkId = nanoid()
        insertChunk.run(chunkId, documentId, item.content)

        const embeddingId = nanoid()
        // Convert embedding array to Buffer for storage
        const embeddingBuffer = Buffer.from(new Float32Array(item.embedding).buffer)
        insertEmbedding.run(embeddingId, chunkId, embeddingBuffer)
      }
    })

    transaction(embeddingsData)
  }

  // Update the chunk count for the document
  db.prepare("UPDATE documents SET chunk_count = ? WHERE id = ?").run(chunks.length, documentId)

  return { success: true, documentId, chunkCount: chunks.length }
}

export async function processCSVDocument(title, content) {
  // Generate a unique ID for the document
  const documentId = nanoid()

  // Insert the document into the database
  db.prepare("INSERT INTO documents (id, title, document_type) VALUES (?, ?, ?)").run(documentId, title, "csv")

  // Process the CSV
  const { rows, headers } = processCSV(content)

  // Store CSV metadata
  db.prepare("INSERT INTO csv_metadata (document_id, headers) VALUES (?, ?)").run(documentId, JSON.stringify(headers))

  // Prepare each row as a chunk for embedding
  const chunks = rows.map((row) => {
    // Create a text representation of the row
    const rowText = headers.map((header) => `${header}: ${row[header]}`).join(". ")
    return rowText
  })

  // Store the raw CSV data
  const insertCSVRow = db.prepare("INSERT INTO csv_data (id, document_id, row_data, row_number) VALUES (?, ?, ?, ?)")

  rows.forEach((row, index) => {
    const rowId = nanoid()
    insertCSVRow.run(rowId, documentId, JSON.stringify(row), index)
  })

  // Process chunks in batches to avoid memory issues
  const batchSize = 100
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize)

    // Generate embeddings for the batch
    const embeddingsData = await generateEmbeddings(batchChunks)

    // Insert chunks and embeddings
    const insertChunk = db.prepare("INSERT INTO chunks (id, document_id, content) VALUES (?, ?, ?)")
    const insertEmbedding = db.prepare("INSERT INTO embeddings (id, chunk_id, embedding) VALUES (?, ?, ?)")

    const transaction = db.transaction((items) => {
      for (let j = 0; j < items.length; j++) {
        const item = items[j]
        const rowIndex = i + j

        const chunkId = nanoid()
        insertChunk.run(chunkId, documentId, item.content)

        const embeddingId = nanoid()
        // Convert embedding array to Buffer for storage
        const embeddingBuffer = Buffer.from(new Float32Array(item.embedding).buffer)
        insertEmbedding.run(embeddingId, chunkId, embeddingBuffer)
      }
    })

    transaction(embeddingsData)
  }

  // Update the chunk count for the document
  db.prepare("UPDATE documents SET chunk_count = ? WHERE id = ?").run(rows.length, documentId)

  return { success: true, documentId, rowCount: rows.length }
}

export async function askQuestion(question, modelName) {
  // Search for relevant chunks
  const relevantChunks = await searchSimilarChunks(question, 5)

  // If no relevant chunks found, return a generic response
  if (relevantChunks.length === 0) {
    return {
      answer:
        "I don't have enough information to answer that question. Try uploading more documents or asking a different question.",
      sources: [],
    }
  }

  // Generate context from relevant chunks
  const context = relevantChunks.map((chunk) => chunk.content).join("\n\n")

  // Generate an answer using the AI model
  const answer = await generateAnswer(question, context, modelName)

  return {
    answer,
    sources: relevantChunks.map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      similarity: chunk.similarity,
    })),
  }
}

export async function askQuestionStream(
  question,
  modelName,
) {
    const { onToken, onSources, onFinish, onError } = callbacks;

  try {
    // Search for relevant chunks
    const relevantChunks = await searchSimilarChunks(question, 5)

    // If callbacks.onSources is defined, call it with the sources
    if (callbacks.onSources) {
      callbacks.onSources(
        relevantChunks.map((chunk) => ({
          id: chunk.id,
          documentId: chunk.documentId,
          documentTitle: chunk.documentTitle,
          similarity: chunk.similarity,
        })),
      )
    }

    // If no relevant chunks found, return a generic response
    if (relevantChunks.length === 0) {
      callbacks.onToken(
        "I don't have enough information to answer that question. Try uploading more documents or asking a different question.",
      )
      callbacks.onFinish()
      return
    }

    // Generate context from relevant chunks
    const context = relevantChunks.map((chunk) => chunk.content).join("\n\n")

    // Stream an answer using the AI model
    await streamAnswer(question, context, modelName, callbacks.onToken)

    callbacks.onFinish()
  } catch (error) {
    console.error("Error in askQuestionStream:", error)
    callbacks.onError(error instanceof Error ? error : new Error("Unknown error"))
  }
}

export async function getDocuments() {
  const documents = db
    .prepare(`
    SELECT 
      d.id, 
      d.title, 
      d.created_at,
      d.document_type,
      d.chunk_count
    FROM documents d
    ORDER BY d.created_at DESC
  `)
    .all()

  return documents
}

export async function deleteDocument(id) {
  db.prepare("DELETE FROM documents WHERE id = ?").run(id)
  return { success: true }
}

export async function testLMStudioConnection() {
  try {
    const response = await fetch("http://localhost:1234/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    return response.ok
  } catch (error) {
    console.error("Error testing LM Studio connection:", error)
    return false
  }
}

export async function getAvailableModels() {
  try {
    const response = await fetch("http://localhost:1234/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch models")
    }

    const modelsData = await response.json()

    // Extract model names from the response
    return modelsData.data.map((model) => model.id)
  } catch (error) {
    console.error("Error fetching available models:", error)
    return []
  }
}
