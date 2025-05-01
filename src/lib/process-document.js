// Import pdf-parse instead of pdfjs-dist for server-side PDF processing
import pdfParse from "pdf-parse"
// Keep Papa for CSV parsing
import Papa from "papaparse"
import { embed } from "ai"

// Function to process attachments (PDF or CSV)
export async function processAttachment(attachment, db, lmstudio) {
  try {
    // Get file content
    const response = await fetch(attachment.url)
    const blob = await response.blob()

    let textContent = ""

    // Process based on file type
    if (attachment.type === "application/pdf") {
      textContent = await extractTextFromPDF(blob)
    } else if (attachment.type === "text/csv") {
      textContent = await extractTextFromCSV(blob)
    } else {
      throw new Error(`Unsupported file type: ${attachment.type}`)
    }

    // Split content into chunks (simple approach - could be improved)
    const chunks = splitIntoChunks(textContent, 1000)

    // Create embeddings and store in database
    await storeEmbeddings(chunks, attachment.name, db, lmstudio)

    return { success: true }
  } catch (error) {
    console.error("Error processing attachment:", error)
    throw error
  }
}

// Extract text from PDF
async function extractTextFromPDF(blob) {
  try {
    // Convert blob to buffer for pdf-parse
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use pdf-parse to extract text
    const data = await pdfParse(buffer)

    // Return the text content
    return data.text
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return "Error extracting text from PDF"
  }
}

// Extract text from CSV
async function extractTextFromCSV(blob) {
  const text = await blob.text()

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      complete: (results) => {
        // Convert CSV to a more readable format
        const headers = results.data[0]
        const rows = results.data.slice(1)

        let formattedText = ""

        rows.forEach((row) => {
          if (row.length === headers.length) {
            const rowObj = {}
            headers.forEach((header, index) => {
              rowObj[header] = row[index]
            })
            formattedText += JSON.stringify(rowObj) + "\n"
          }
        })

        resolve(formattedText)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

// Split text into chunks
function splitIntoChunks(text, chunkSize) {
  const chunks = []
  const sentences = text.split(/[.!?]\s+/)

  let currentChunk = ""

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      chunks.push(currentChunk)
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

// Store embeddings in database
async function storeEmbeddings(chunks, fileName, db, lmstudio) {
  // Create tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT,
      chunk_index INTEGER,
      content TEXT
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER,
      embedding BLOB,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    )
  `)

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    // Insert document
    const documentResult = await db.execute({
      sql: "INSERT INTO documents (file_name, chunk_index, content) VALUES (?, ?, ?)",
      args: [fileName, i, chunk],
    })

    const documentId = Number(documentResult.lastInsertId)

    // Generate embedding
    const { embedding } = await embed({
      model: lmstudio.embedding("text-embedding-mxbai-embed-large-v1"),
      value: chunk,
    })

    // Store embedding as a binary blob
    const embeddingBlob = Buffer.from(new Float32Array(embedding).buffer)

    await db.execute({
      sql: "INSERT INTO embeddings (document_id, embedding) VALUES (?, ?)",
      args: [documentId, embeddingBlob],
    })
  }
}
