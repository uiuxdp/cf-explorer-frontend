// components/BatchEmbeddingGenerator.jsx
'use client';

import { useState } from 'react';
import { embed } from 'ai';
import { lmStudio } from '../utils/lmStudioProvider';

export default function Embed() {
  const [texts, setTexts] = useState(['sunny day at the beach', 'rainy night in the city']);
  const [embeddings, setEmbeddings] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newText, setNewText] = useState('');

  const addText = () => {
    if (newText.trim()) {
      setTexts([...texts, newText.trim()]);
      setNewText('');
    }
  };

  const removeText = (index) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const generateEmbeddings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await embed({
        model: lmStudio.embedding('text-embedding-ada-002'),
        values: texts,
      });
      
      setEmbeddings(result.embeddings);
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
      <h1 className="text-2xl font-bold mb-4">Batch Embeddings with LM Studio</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Add text to batch:</label>
        <div className="flex">
          <input
            type="text"
            className="flex-grow p-2 border rounded mr-2"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter text and click Add"
          />
          <button
            onClick={addText}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Texts to embed:</h2>
        <ul className="border rounded divide-y">
          {texts.map((text, index) => (
            <li key={index} className="p-2 flex justify-between items-center">
              <span>{text}</span>
              <button
                onClick={() => removeText(index)}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <button
        onClick={generateEmbeddings}
        disabled={loading || texts.length === 0}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Generating...' : 'Generate Embeddings'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {embeddings && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Embedding Results:</h2>
          <div className="mt-2 bg-gray-100 p-3 rounded overflow-auto max-h-96">
            {embeddings.map((embedding, index) => (
              <div key={index} className="mb-2">
                <p className="font-semibold">{texts[index]}:</p>
                <p className="font-mono text-sm">[{embedding.slice(0, 3).map(n => n.toFixed(6)).join(', ')}... (truncated)]</p>
              </div>
            ))}
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