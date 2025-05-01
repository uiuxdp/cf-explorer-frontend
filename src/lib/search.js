import { embed, cosineSimilarity } from "ai"

// Function to search for relevant documents
export async function searchDocuments(query, db, lmstudio, topK = 3) {
  try {
    // Generate embedding for the query
    const { embedding: queryEmbedding } = await embed({
      model: lmstudio.embedding("text-embedding-mxbai-embed-large-v1"),
      value: query,
    })

    // Get all documents and embeddings from the database
    const documentsResult = await db.execute("SELECT * FROM documents")
    const embeddingsResult = await db.execute("SELECT * FROM embeddings")

    const documents = documentsResult.rows
    const embeddings = embeddingsResult.rows

    // Calculate similarity scores
    const scores = []

    for (const embeddingRow of embeddings) {
      const documentId = Number(embeddingRow.document_id)
      const embeddingBlob = embeddingRow.embedding

      // Convert blob back to Float32Array
      const embeddingBuffer = Buffer.from(embeddingBlob).buffer
      const documentEmbedding = Array.from(new Float32Array(embeddingBuffer))

      // Calculate cosine similarity
      const similarity = cosineSimilarity(queryEmbedding, documentEmbedding)

      scores.push({
        documentId,
        score: similarity,
      })
    }

    // Sort by similarity score (descending)
    scores.sort((a, b) => b.score - a.score)

    // Get top K documents
    const topDocuments = []

    for (let i = 0; i < Math.min(topK, scores.length); i++) {
      const documentId = scores[i].documentId
      const document = documents.find((doc) => Number(doc.id) === documentId)

      if (document) {
        topDocuments.push(document.content)
      }
    }

    return topDocuments
  } catch (error) {
    console.error("Error searching documents:", error)
    return []
  }
}
