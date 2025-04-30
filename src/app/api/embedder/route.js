import { NextResponse } from "next/server"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { embedMany } from "ai"

// Initialize database
const dbPath = path.join(process.cwd(), "data", "rag.db")

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}


const generateChunks = (input) => {
    return input
      .trim()
      .split(".")
      .filter((i) => i !== "");
  };
  
  export const generateEmbeddings = async (
    value,
  ) => {
    const chunks = generateChunks(value);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
  };

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: 'http://localhost:1234/v1',
  maxRetries: 1, // immediately error if the server is not running
})

// Initialize the database
function initializeDb() {
  const db = new Database(dbPath)

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER,
      date TEXT,
      sub_channels TEXT,
      comments TEXT,
      sentiment TEXT,
      sentan INTEGER,
      embedding BLOB
    );
    
    CREATE TABLE IF NOT EXISTS embeddings_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT,
      dimensions INTEGER
    );
  `)

  return db
}

export async function POST(request) {
  try {
    const { data } = await request.json()

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const db = initializeDb()

    // Prepare texts for batch embedding
    const textsToEmbed = data.map(item => 
      `${item.Number || ""} ${item.Date || ""} ${item["Sub-Channels"] || ""} ${item.Comments || ""} ${item.Sentiment || ""} ${item.Sentan || ""}`
    )

    // Batch embed all texts at once
    const embeddingModelName = "text-embedding-nomic-embed-text-v1.5"
    // Get embeddings
    const embeddingResults = await embedMany({
      model: lmstudio.textEmbeddingModel(embeddingModelName),
      values: textsToEmbed,
      maxRetries: 1,
    })
    
  

    // Begin transaction for better performance
    const insertStmt = db.prepare(`
      INSERT INTO entries (number, date, sub_channels, comments, sentiment, sentan, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction((items, embeddings) => {
      // Check the structure of embeddings
      if (!embeddings || !Array.isArray(embeddings.embeddings)) {
        throw new Error("Unexpected embedding results structure: " + JSON.stringify(embeddings).substring(0, 200))
      }
      
      for (let i = 0; i < items.length; i++) {
        if (i >= embeddings.embeddings.length) {
          console.warn(`No embedding found for item at index ${i}`)
          continue
        }
        
        const item = items[i]
        const embedding = embeddings.embeddings[i]
     
        if (!embedding) {
          console.warn(`Embedding at index ${i} is undefined`)
          continue
        }
        
        // Store as binary blob
        const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer)
        insertStmt.run(
          item.Number || null,
          item.Date || null,
          item["Sub-Channels"] || null,
          item.Comments || null,
          item.Sentiment || null,
          item.Sentan || null,
          embeddingBuffer
        )
      }
    })

    transaction(data, embeddingResults)
    db.close()

    return NextResponse.json({ success: true, count: data.length })
  } catch (error) {
    console.error("Error processing data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}