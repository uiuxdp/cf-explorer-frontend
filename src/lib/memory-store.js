// lib/memory-store.js
let documents = []
export function getDocuments() {
  return documents
}
export function addToDocuments(doc) {
  documents.push(doc)
}
