// First, create a custom LM Studio provider for AI SDK
// utils/lmStudioProvider.js
import { createAI } from 'ai';

export const lmStudio = {
  embedding: (modelName) => ({
    // Return a configuration object that AI SDK can use
    modelId: modelName || 'text-embedding-ada-002', // Default model name used by LM Studio
    provider: 'lm-studio',
    // Custom implementation of the embedding function
    embed: async ({ value, values }) => {
      const input = values || [value];
      
      try {
        // Connect to your LM Studio instance
        const response = await fetch('http://localhost:1234/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName || 'text-embedding-ada-002',
            input: input,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`LM Studio API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Format the result to match AI SDK's expected format
        if (values) {
          return {
            embeddings: result.data.map(item => item.embedding),
            usage: result.usage,
          };
        } else {
          return {
            embedding: result.data[0].embedding,
            usage: result.usage,
          };
        }
      } catch (error) {
        console.error('Error generating embeddings:', error);
        throw error;
      }
    }
  })
};

// Now create a component that uses this provider
// components/EmbeddingGenerator.jsx
'use client';

import { useState } from 'react';
import { embed } from 'ai';
import { lmStudio } from '../utils/lmStudioProvider';

export default function EmbeddingGenerator() {
  const [text, setText] = useState('sunny day at the beach');
  const [embedding, setEmbedding] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateEmbedding = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await embed({
        model: lmStudio.embedding('text-embedding-ada-002'), // Use the model available in your LM Studio
        value: text,
      });
      
      setEmbedding(result.embedding);
      setUsage(result.usage);
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">LM Studio Embeddings</h1>
      <div className="mb-4">
        <label className="block mb-2">Text to embed:</label>
        <textarea
          className="w-full p-2 border rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
      </div>
      
      <button
        onClick={generateEmbedding}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Generating...' : 'Generate Embedding'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {embedding && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Embedding Result:</h2>
          <div className="mt-2 bg-gray-100 p-3 rounded overflow-auto max-h-60">
            <p className="font-mono">[{embedding.slice(0, 5).map(n => n.toFixed(6)).join(', ')}... (truncated)]</p>
            <p className="mt-2">Vector dimension: {embedding.length}</p>
          </div>
        </div>
      )}
      
      {usage && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Usage:</h2>
          <pre className="mt-2 bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(usage, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Add this component to a page
// app/embed/page.js (for App Router)
export default function EmbedPage() {
  return (
    <div>
      <EmbeddingGenerator />
    </div>
  );
}