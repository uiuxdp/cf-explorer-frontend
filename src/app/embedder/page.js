// "use client"

// import { useState } from "react"
// import Papa from "papaparse"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Loader2, Upload } from "lucide-react"

// export default function EmbedderPage() {
//   const [file, setFile] = useState(null)
//   const [uploading, setUploading] = useState(false)
//   const [progress, setProgress] = useState(0)
//   const [message, setMessage] = useState("")

//   const handleFileChange = (e) => {
//     if (e.target.files.length > 0) {
//       setFile(e.target.files[0])
//     }
//   }

//   const uploadCSV = async () => {
//     if (!file) {
//       setMessage("Please select a file first")
//       return
//     }

//     setUploading(true)
//     setProgress(0)
//     setMessage("Parsing CSV file...")

//     Papa.parse(file, {
//       header: true,
//       complete: async (results) => {
//         const data = results.data

//         const CHUNK_SIZE = 100 
//         const totalChunks = Math.ceil(data.length / CHUNK_SIZE)

//         setMessage(`Processing ${data.length} rows in ${totalChunks} chunks...`)

//         for (let i = 0; i < totalChunks; i++) {
//           const chunk = data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)

//           try {
//             const response = await fetch("/api/embedder", {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify({ data: chunk }),
//             })

//             if (!response.ok) {
//               throw new Error(`Error uploading chunk ${i + 1}`)
//             }

//             // Update progress
//             setProgress(((i + 1) / totalChunks) * 100)
//             setMessage(`Processed chunk ${i + 1} of ${totalChunks}`)
//           } catch (error) {
//             setMessage(`Error: ${error.message}`)
//             setUploading(false)
//             return
//           }
//         }

//         setMessage("Upload complete! Data has been embedded and stored.")
//         setUploading(false)
//         setProgress(100)
//       },
//       error: (error) => {
//         setMessage(`Error parsing CSV: ${error.message}`)
//         setUploading(false)
//       },
//     })
//   }

//   return (
//     <div className="container mx-auto py-10">
//       <h1 className="text-3xl font-bold mb-6">Data Embedder</h1>
//       <Card className="p-6">
//         <div className="mb-6">
//           <h2 className="text-xl font-semibold mb-2">Upload CSV Data</h2>
//           <p className="text-gray-600 mb-4">
//             Upload a CSV file with columns: Number, Date, Sub-Channels, Comments, Sentiment, Sentan
//           </p>

//           <div className="flex items-center gap-4 mb-4">
//             <input
//               type="file"
//               accept=".csv"
//               onChange={handleFileChange}
//               className="block w-full text-sm text-gray-500
//                 file:mr-4 file:py-2 file:px-4
//                 file:rounded-md file:border-0
//                 file:text-sm file:font-semibold
//                 file:bg-gray-50 file:text-gray-700
//                 hover:file:bg-gray-100"
//             />
//             <Button onClick={uploadCSV} disabled={!file || uploading} className="flex items-center gap-2">
//               {uploading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <Upload className="h-4 w-4" />
//                   Upload
//                 </>
//               )}
//             </Button>
//           </div>

//           {uploading && (
//             <div className="mb-4">
//               <p className="text-sm text-gray-600">{progress.toFixed(0)}% complete</p>
//             </div>
//           )}

//           {message && (
//             <div
//               className={`p-3 rounded-md ${message.includes("Error") ? "bg-red-50 text-red-700" : message.includes("complete") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}
//             >
//               {message}
//             </div>
//           )}
//         </div>
//       </Card>
//     </div>
//   )
// }
'use client'

import { useState } from 'react'
import axios from 'axios'

export default function UploadPage() {
  const [slug, setSlug] = useState('')
  const [files, setFiles] = useState(null)
  const [message, setMessage] = useState('')

  const handleUpload = async () => {
    if (!slug || !files?.length) {
      setMessage('Please provide a slug and at least one CSV file.')
      return
    }

    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await axios.post(
        `http://localhost:1111/upload/${slug}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      setMessage(`Upload successful: ${response.data.message}`)
    } catch (err) {
      console.error(err)
      setMessage(`Upload failed: ${err?.response?.data?.detail || err.message}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Upload CSVs for an Agent</h1>
      <input
        type="text"
        placeholder="Agent slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="border p-2 w-full mb-4"
      />
      <input
        type="file"
        accept=".csv"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  )
}
