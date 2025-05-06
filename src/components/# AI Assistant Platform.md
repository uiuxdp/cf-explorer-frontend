# AI Assistant Platform

An AI-powered assistant platform for **Dubai Police**, enabling the creation of dynamic Retrieval-Augmented Generation (RAG) applications through a full-stack system that integrates CMS-driven assistant creation, local language models, embeddings, transcription, and chat interfaces.

---

## 🚀 Overview

This project is a full-stack AI application designed for the **Dubai Police** to dynamically deploy intelligent assistant agents. The system supports two primary use cases:

1. **Custom RAG Assistants**: Users can upload data (e.g., CSVs) via a custom RAG page and interact with it through AI chat.
2. **Pre-Created Assistants**: Assistants defined and managed in the CMS (Strapi) are ready for use based on predefined datasets.

### Key Components

- **Frontend:** Built with [Next.js] for a modern chat UI and assistant interface
- **Backend (CMS):** Powered by [Strapi] to dynamically manage assistant metadata and content
- **Transcription:** Utilizes [Whisper]to convert user voice input into text
- **Embedding DB:** Uses [ChromaDB] for storing and searching document embeddings
- **LLM & Embeddings:** Hosted via [LM Studio] to run:
  - **LLM:** `qwen2.5-7b-instruct-1m`
  - **Embedding Model:** `text-embedding-nomic-embed-text-v1.5`
