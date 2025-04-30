"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"

export default function Home() {
  const [embeddingText, setEmbeddingText] = useState("")
  const [embedding, setEmbedding] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Set up chat functionality
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  // Function to generate embeddings
  const generateEmbedding = async () => {
    if (!embeddingText) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: embeddingText }),
      })

      const data = await response.json()
      setEmbedding(data.embedding)
    } catch (error) {
      console.error("Error generating embedding:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">LM Studio Integration</h1>

        <div className="mb-12 p-6 border rounded-lg bg-white shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Chat with LLM</h2>
          <div className="mb-4 max-h-96 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`mb-2 p-3 rounded-lg ${m.role === "user" ? "bg-blue-100 ml-12" : "bg-gray-100 mr-12"}`}
              >
                <p className="font-semibold">{m.role === "user" ? "You" : "AI"}</p>
                <p>{m.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask something..."
              className="flex-1 p-2 border rounded"
            />
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              Send
            </button>
          </form>
        </div>

        <div className="p-6 border rounded-lg bg-white shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Generate Embeddings</h2>
          <div className="mb-4">
            <textarea
              value={embeddingText}
              onChange={(e) => setEmbeddingText(e.target.value)}
              placeholder="Enter text to generate embeddings..."
              className="w-full p-2 border rounded h-24"
            />
          </div>
          <button
            onClick={generateEmbedding}
            disabled={isLoading || !embeddingText}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            {isLoading ? "Generating..." : "Generate Embedding"}
          </button>

          {embedding && (
            <div className="mt-4">
              <h3 className="font-semibold">Embedding Result:</h3>
              <div className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                <p className="text-xs">
                  [
                  {embedding
                    .slice(0, 5)
                    .map((n) => n.toFixed(6))
                    .join(", ")}
                  , ...
                  {embedding.length > 5 ? ` (${embedding.length} dimensions total)` : ""}]
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
