"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Send, FileText, FileSpreadsheet } from "lucide-react"
import { useChat } from "@ai-sdk/react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat2",
  })

  const [files, setFiles] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()

    handleSubmit(e, {
      experimental_attachments: files ? Array.from(files) : undefined,
    })

    // Reset file input
    setFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (file) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4 mr-1" />
    } else if (file.type === "text/csv") {
      return <FileSpreadsheet className="h-4 w-4 mr-1" />
    }
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-xl">RAG Chat with LM Studio</CardTitle>
        </CardHeader>

        <CardContent className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <h3 className="font-medium text-lg">Welcome to RAG Chat</h3>
                <p className="mt-1">Upload a PDF or CSV file to get started</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.content}

                {message.experimental_attachments?.map((attachment, index) => (
                  <div key={index} className="mt-2 text-xs flex items-center">
                    {attachment.type === "application/pdf" && <FileText className="h-4 w-4 mr-1" />}
                    {attachment.type === "text/csv" && <FileSpreadsheet className="h-4 w-4 mr-1" />}
                    {attachment.name}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800">
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t bg-white">
          <form onSubmit={handleFormSubmit} className="flex w-full space-x-2">
            {files && files.length > 0 && (
              <div className="flex items-center mr-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {getFileIcon(files[0])}
                {files[0].name}
              </div>
            )}

            <div className="relative flex-grow">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="pr-10"
                disabled={isLoading}
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.csv" className="hidden" />
            </div>

            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
