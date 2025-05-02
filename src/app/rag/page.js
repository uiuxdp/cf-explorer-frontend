"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Trash, Upload, FileText, FileSpreadsheet } from "lucide-react"
import { generateContentWithRAG, addDocument } from "./actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import { ThumbsDown, ThumbsUp, Plus } from "lucide-react"
import { GlowEffect } from "@/components/ui/glow-effect"
// import { toast } from "@/components/ui/use-toast"
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';


pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@2.10.377/build/pdf.worker.min.js`;



export default function RAGPage() {
  const [extractedText, setExtractedText] = useState('');
  const [documents, setDocuments] = useState([])
  const [newDocument, setNewDocument] = useState("")
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fileUploading, setFileUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documentStats, setDocumentStats] = useState({ count: 1, chunks: 1 })

  const handleAddDocument = async () => {
    if (newDocument.trim()) {
      try {
        const result = await addDocument(newDocument.trim())
        setDocuments([...documents, newDocument.trim()])
        setNewDocument("")

        if (result?.chunkCount > 1) {
          // toast({
          //   title: "Document added",
          //   description: `Document was split into ${result.chunkCount} chunks for processing`,
          // })
          console.log(`Document was split into ${result.chunkCount} chunks for processing`);
          
          setDocumentStats((prev) => ({
            count: prev.count + 1,
            chunks: prev.chunks + result.chunkCount,
          }))
        } else {
          setDocumentStats((prev) => ({
            count: prev.count + 1,
            chunks: prev.chunks + 1,
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add document")
      }
    }
  }

  const handleRemoveDocument = (index) => {
    const newDocs = [...documents]
    newDocs.splice(index, 1)
    setDocuments(newDocs)
    setDocumentStats((prev) => ({
      count: prev.count - 1,
      chunks: prev.chunks - 1, // This is an approximation since we don't track chunks per document
    }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileUploading(true)
    setUploadProgress(0)

    try {
      if (file.type === "application/pdf") {
        await handlePdfUpload(file)
      } else if (
        file.type === "text/csv" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        await handleCsvUpload(file)
      } else {
        setError("Unsupported file type. Please upload a PDF or CSV file.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process the file.")
    } finally {
      setFileUploading(false)
      setUploadProgress(100)
      // Reset the file input
      e.target.value = ""

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert('Please select a PDF file!');
      return;
    }

    setLoading(true);
    setUploadProgress(10); // Initial progress start

    const formData = new FormData();
    formData.append("file", file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
        
        // Update progress (estimate based on pages)
        setUploadProgress(Math.floor((i / pdf.numPages) * 50)); // First 50% for extraction
      }

      // Show extracted text (for debugging or display)
      setExtractedText(fullText);

      // Optionally process the extracted text here (chunking or other logic)
      console.log('Extracted text:', fullText);

      setUploadProgress(100); // Final progress
    } catch (err) {
      console.error('Error during PDF extraction:', err);
      setExtractedText('Error during extraction.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (file) => {
    const text = await file.text()

    // Add the document to the UI list
    setDocuments([...documents, `CSV: ${file.name} (${Math.round(file.size / 1024)}KB)`])

    // Process the document in chunks
    const result = await addDocument(text)

    // toast({
    //   title: "CSV processed successfully",
    //   description: `${file.name} was split into ${result.chunkCount} chunks for processing`,
    // })
console.log(`${file.name} was split into ${result.chunkCount} chunks for processing`);

    setDocumentStats((prev) => ({
      count: prev.count + 1,
      chunks: prev.chunks + result.chunkCount,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Generate content based on the query
      const response = await generateContentWithRAG(query)
      setResult(response)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate content. Make sure LM Studio server is running.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020001]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative gap-7 p-8 pt-[100px] ">
        {/* Chat Area */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[160px] rounded-full w-[1000px] h-[500px] bg-gradient-to-br opacity-70 from-[#2b693a] to-[#00461e]"></div>
        <div className="flex-1 flex overflow-hidden gap-5 relative z-10">
          <div className="flex-1 flex flex-col overflow-hidden rounded-lg max-w-[800px] mx-auto">
            <div className="p-4 flex flex-col h-full">
              {!result && (
                <div className="text-center mb-4 pt-[100px]">
                  <div>
                    <div className="relative max-w-20 mx-auto mb-11">
                      <div className="aspect-square relative ">
                        <Image src={"/star.svg"} fill alt="" />
                      </div>

                      <div className="aspect-square absolute w-[50%] -top-[20%] -left-[30%]">
                        <Image src={"/star.svg"} fill alt="" />
                      </div>
                    </div>
                  </div>
                  <h1 className="text-base font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#a0fbb3] to-[#fefefe] mb-3">
                    {" "}
                    I am an CX Feedback AI assistant.{" "}
                  </h1>
                  <h1 className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#a0fbb3] to-[#fefefe]">
                    {" "}
                    What can i do for
                    <br /> you Today?{" "}
                  </h1>
                </div>
              )}
              <ScrollArea className="flex-1 ">
                {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">Error: {error}</div>}

                {result && (
                  <div className="mb-6 pr-6 max-w-[800px] ml-auto">
                    <div className="flex gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-30%20at%207.51.38%E2%80%AFPM-xaPUwKfWTkYwpcPasYsk0x0gucxecP.png" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 relative ">
                        <GlowEffect colors={["#0ca361", "#b8ffdf", "#838383", "#0b4f31"]} mode="static" blur="medium" />
                        <div className="bg-[#0e110e] relative p-5 rounded-[0px_24px_24px_24px] prose text-[#d9fde1]">
                          <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-11">
                      <Button variant="ghost" size="icon">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                      <div className="ml-auto flex gap-2"></div>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div
                className="rounded-lg p-4 border border-[#adfcda94] bg-[#dfdfdf1a] shadow-[0px_0px_14px_0px_#097647]"
                style={{ position: "sticky", bottom: 0 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    placeholder="Ask a question..."
                    className="min-h-[100px] bg-transparent w-full text-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !query.trim() || documents.length === 0}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-4 bg-white rounded-lg">
            <ScrollArea className="flex-1 max-h-[calc(100vh-200px)]">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newDocument}
                    onChange={(e) => setNewDocument(e.target.value)}
                    placeholder="Enter a document or fact..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddDocument} disabled={!newDocument.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* File Upload Section */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Upload Documents</h3>
                        <div className="ml-2">
                          {documentStats.chunks} chunks
                        </div>
                      </div>

                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex space-x-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">Upload PDF or CSV files</p>

                          {uploadProgress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                              <div
                                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          )}

                          <Input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.csv,.xls,.xlsx"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={fileUploading}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("file-upload").click()}
                            disabled={fileUploading}
                          >
                            {fileUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Choose File
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="border rounded-md divide-y">
                  <h3 className="font-medium p-3 border-b">Knowledge Base ({documentStats.count} documents)</h3>
                  {documents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">No documents added yet</div>
                  ) : (
                    documents.map((doc, index) => (
                      <div key={index} className="p-3 flex justify-between items-start">
                        <div className="text-sm max-h-20 overflow-hidden text-ellipsis">
                          {doc.length > 100 ? `${doc.substring(0, 100)}...` : doc}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(index)}>
                          <Trash className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
