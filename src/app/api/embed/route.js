
// import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
// import { embedMany } from 'ai';

// const lmstudio = createOpenAICompatible({
//   name: 'lmstudio',
//   baseURL: 'http://localhost:1234/v1',
// });

// // 'embeddings' is an array of embedding objects (number[][]).
// // It is sorted in the same order as the input values.
// const { embeddings, usage, values } = await embedMany({
//   model: lmstudio.textEmbeddingModel('text-embedding-nomic-embed-text-v1.5'),
//   values: [
//     'sunny day at the beach',
//     'rainy afternoon in the city',
//     'snowy night in the mountains',
//   ],
// });

// console.log(values, usage,"logggg"); 


import { MODEL_EMBED } from "@/lib/constants";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { embed, embedMany } from "ai"

// Create a custom provider for LM Studio
const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://10.90.115.176:1234/v1",
})

export async function POST(req) {
  const { text } = await req.json()

  try {
    // Generate embeddings using the embedding model
    const { embedding } = await embed({
      model: lmstudio.textEmbeddingModel(MODEL_EMBED), // Replace with your actual embedding model
      value: text,
    })

    // const { embeddings } = await embedMany({
    //     model: lmstudio.textEmbeddingModel(MODEL_EMBED),
    //     values: chunks,
    //   });

    return Response.json({ embedding })
  } catch (error) {
    console.error("Embedding error:", error)
    return Response.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}
