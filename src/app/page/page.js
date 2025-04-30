"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { processDocument } from "@/lib/actions"
import { Loader2, Upload, Check, AlertCircle } from "lucide-react"

export default function DocumentUploader() {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadStatus("idle")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      setUploadStatus("idle")

      // Convert file to text
      const text = await file.text()

      // Process the document
      const result = await processDocument(file.name, text)


      setUploadStatus("success")
      setStatusMessage(`Document processed with ${result.chunkCount} chunks`)
    } catch (error) {
      console.error("Error uploading document:", error)
      setUploadStatus("error")
      setStatusMessage("Failed to process document")
    } finally {
      setIsUploading(false)
      setFile(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input type="file" accept=".txt,.md,.csv" onChange={handleFileChange} className="flex-1" />
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {uploadStatus !== "idle" && (
        <Card
          className={`p-3 flex items-center ${
            uploadStatus === "success" ? "bg-green-50" : uploadStatus === "error" ? "bg-red-50" : ""
          }`}
        >
          {uploadStatus === "success" ? (
            <Check className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span>{statusMessage}</span>
        </Card>
      )}
    </div>
  )
}
