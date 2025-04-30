"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Trash } from "lucide-react"
import { generateContentWithRAG, addDocument } from "./actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown";
import { useChat } from "@ai-sdk/react";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  Copy,
  Edit3,
  CloudLightningIcon as Lightning,
  MoreVertical,
  Plus,
  RefreshCw,
  Settings,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Zap,
  Mic,
  MicOff,
} from "lucide-react";
import { GlowEffect } from "@/components/ui/glow-effect"
import { fetchSheetData } from "@/lib/utils"

export default function RAGPage() {
    const base=`
I am the AI Feedback Assistant for the Dubai Police website. My role is to analyze public feedback submitted through the website’s Happiness Meter and other input channels. I use natural language understanding and sentiment analysis to interpret user comments and generate structured insights.

I can detect sentiment (e.g., Happy, Neutral, Unhappy), identify common themes in feedback, and summarize issues related to specific services such as Police Clearance, Lost Item Reports, Traffic Services, and General Inquiries.

My goal is to support Dubai Police in improving digital services by providing clear, data-driven insights from public opinion. I do not store personal data, and my analysis is based only on the textual feedback provided by users.
  `
    
//   const [csv, setCsv] = useState("");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const data = await fetchSheetData();
//         setCsv(data);
//       } catch (error) {
//         console.error("Error fetching sheet data:", error);
//       }
//     };
//     fetchData();
//   }, []);
// console.log(csv,"asgh");
const csv =  `Number,Date,Sub-Channels,Comments,Sentiment,Sentan
0,20/02/2024,Police Clearance Certificate,Nice,Happy,4
1,20/02/2024,Police Clearance Certificate,Quick and Easy,Happy,5
2,20/02/2024,Police Clearance Certificate,All is good,Happy,5
3,20/02/2024,Police Clearance Certificate,Great,Happy,5
4,20/02/2024,Police Clearance Certificate,Always The Best,Happy,5
5,20/02/2024,Police Clearance Certificate,Easy,Happy,5
6,19/02/2024,Certificate of Loss,Great Experience,Happy,5
7,19/02/2024,Police Clearance Certificate,Thank you so much,Happy,5
8,19/02/2024,Police Clearance Certificate,Good,Happy,4
9,19/02/2024,Police Clearance Certificate,Easy and Fast,Happy,5
10,19/02/2024,Traffic clearance certificate,Thanks,Unhappy,5
11,19/02/2024,Traffic clearance certificate,Very bad ,Unhappy,5
12,19/02/2024,HQ visit,Worst experience,Unhappy,5`
   
  const [documents, setDocuments] = useState([base,csv])

  const [newDocument, setNewDocument] = useState("")
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAddDocument = () => {
    if (newDocument.trim()) {
      setDocuments([...documents, newDocument.trim()])
      setNewDocument("")
    }
  }

  const handleRemoveDocument = (index) => {
    const newDocs = [...documents]
    newDocs.splice(index, 1)
    setDocuments(newDocs)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // First, add all documents to our "database"
      for (const doc of documents) {
        await addDocument(doc)
      }

      // Then generate content based on the query
      const response = await generateContentWithRAG(query)
      setResult(response)
      console.log(result,"resssss");
      
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
    {/* Left Sidebar */}

    {/* Main Content */}
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative gap-7 p-8 ">
      {/* Chat Area */}
      <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[160px] rounded-full w-[1000px]  h-[500px] bg-gradient-to-br opacity-70 from-[#2b693a] to-[#00461e]"></div>
      {/* <div className="absolute -bottom-[90%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[160px] rounded-full w-[1000px]  h-[500px] bg-gradient-to-br opacity-70 from-[#2b693a] to-[#00461e]"></div> */}
      {/* <div className="absolute top-0 left-[60%]  -translate-y-1/2 filter blur-[160px] rounded-full w-[600px]  h-[500px]  bg"></div> */}
      <div className="flex-1 flex overflow-hidden  gap-5 relative z-10">
        <div className="flex-1 flex flex-col overflow-hidden   rounded-lg max-w-[800px] mx-auto">
          <div className="p-4 flex flex-col h-full">
           {!result&&
              <div className="text-center mb-4 pt-[100px]">
                <div>
                  <div className="relative max-w-20  mx-auto mb-11">
                    <div className="aspect-square relative ">
                      <Image src={"/star.svg"} fill alt="" />
                    </div>

                    <div className="aspect-square absolute w-[50%] -top-[20%] -left-[30%]">
                      <Image src={"/star.svg"} fill alt="" />
                    </div>
                  </div>
                </div>
                <h1 className="text-base font-normal  text-transparent bg-clip-text bg-gradient-to-r from-[#a0fbb3] to-[#fefefe] mb-3">
                  {" "}
                  I am an CX Feedback AI assistant.{" "}
                </h1>
                <h1 className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#a0fbb3] to-[#fefefe]">
                  {" "}
                  What can i do for
                  <br /> you Today?{" "}
                </h1>
              </div>
            }
            <ScrollArea className="flex-1 ">
              {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                  Error: {error}
                </div>
              )}

{error && <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

{result && (
  <div className="mb-6 pr-6 max-w-[800px] ml-auto">
  <div className="flex gap-3 mb-3">
    <Avatar className="h-8 w-8">
      <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-30%20at%207.51.38%E2%80%AFPM-xaPUwKfWTkYwpcPasYsk0x0gucxecP.png" />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>

    <div className="flex-1 relative ">
      <GlowEffect
        colors={[
          "#0ca361",
          "#b8ffdf",
          "#838383",
          "#0b4f31",
        ]}
        mode="static"
        blur="medium"
      />
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
              {/* {console.log(messages, "messagesmessagesmessages")}
              {messages.map((message, index) => (
                <>
                  {message.role === "user" ? (
                    <div className="mb-6">
                      <div className="flex gap-3 mb-3">
                      

                        <div className="flex-1 ml-auto max-w-[480px]">
                          <div className=" text-white bg-[#ffffff21] w-max p-5 rounded-[24px_0px_24px_24px] max-w-[476px] ml-auto">
                            <p
                              className="text-white-800 prose whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: message.content,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 pr-6 max-w-[800px] ml-auto">
                      <div className="flex gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-30%20at%207.51.38%E2%80%AFPM-xaPUwKfWTkYwpcPasYsk0x0gucxecP.png" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 relative ">
                          <GlowEffect
                            colors={[
                              "#0ca361",
                              "#b8ffdf",
                              "#838383",
                              "#0b4f31",
                            ]}
                            mode="static"
                            blur="medium"
                          />
                          <div className="bg-[#0e110e] relative p-5 rounded-[0px_24px_24px_24px] prose text-[#d9fde1]">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                         
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
                </>
              ))} */}
              {/* {isLoading && (
                <div className="flex items-center">
                  <div className="aspect-[1/1] relative w-[30px] rounded-full overflow-hidden me-3 ">
                    <video
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      autoPlay={true}
                      loop={true}
                      muted={true}
                      playsInline={true}
                    >
                      <source src="/ai.webm" type="video/webm" />
                    </video>
                  </div>
                  <TextShimmer
                    duration={1.2}
                    className="text-xl font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]"
                  >
                    Just a sec...
                  </TextShimmer>
                </div>
              )} */}
            </ScrollArea>

            {/* Regenerate Button */}

            {/* <div className="flex justify-start overflow-x-auto gap-2 my-4">
              {metadata?.analysis?.recommendedQuestions?.map((item, i) => {
                return (
                  <>
                    <Button
                      onClick={() => setQueuedInput(item)}
                      variant="outline"
                      className="w-[40%] me-3 flex-initial whitespace-normal text-left h-auto rounded-xl border-[#0d9056] bg-gradient-to-br from-[#0f8d54] to-[#062819] text-white flex-grow-0 flex-shrink-0 flex-basis-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {item}
                    </Button>
                  </>
                );
              })}
            </div> */}

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
                <Button type="submit" disabled={loading || !query.trim() || documents.length === 0} className="w-full">
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

                <div className="border rounded-md divide-y">
                  {documents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">No documents added yet</div>
                  ) : (
                    documents.map((doc, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div className="text-sm">{doc}</div>
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
    // <main className="container mx-auto py-10 px-4">
    //   <div className="max-w-4xl mx-auto">
    //     <h1 className="text-3xl font-bold mb-6">RAG with Embeddings</h1>
    //     <p className="text-muted-foreground mb-8">
    //       Add knowledge documents, then ask questions to generate content based on that knowledge.
    //     </p>

    //     <div className="grid md:grid-cols-2 gap-6 mb-8">
    //       <Card>
    //         <CardHeader>
    //           <CardTitle>Knowledge Base</CardTitle>
    //           <CardDescription>Add documents to your knowledge base</CardDescription>
    //         </CardHeader>
    //         <CardContent>
    //           <div className="space-y-4">
    //             <div className="flex space-x-2">
    //               <Input
    //                 value={newDocument}
    //                 onChange={(e) => setNewDocument(e.target.value)}
    //                 placeholder="Enter a document or fact..."
    //                 className="flex-1"
    //               />
    //               <Button onClick={handleAddDocument} disabled={!newDocument.trim()}>
    //                 <Plus className="h-4 w-4 mr-2" />
    //                 Add
    //               </Button>
    //             </div>

    //             <div className="border rounded-md divide-y">
    //               {documents.length === 0 ? (
    //                 <div className="p-4 text-center text-muted-foreground text-sm">No documents added yet</div>
    //               ) : (
    //                 documents.map((doc, index) => (
    //                   <div key={index} className="p-3 flex justify-between items-center">
    //                     <div className="text-sm">{doc}</div>
    //                     <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(index)}>
    //                       <Trash className="h-4 w-4 text-muted-foreground" />
    //                     </Button>
    //                   </div>
    //                 ))
    //               )}
    //             </div>
    //           </div>
    //         </CardContent>
    //       </Card>

    //       <Card>
    //         <CardHeader>
    //           <CardTitle>Generate Content</CardTitle>
    //           <CardDescription>Ask a question based on your knowledge base</CardDescription>
    //         </CardHeader>
    //         <CardContent>
    //           <form onSubmit={handleSubmit} className="space-y-4">
    //             <textarea
    //               placeholder="Ask a question..."
    //               className="min-h-[100px]"
    //               value={query}
    //               onChange={(e) => setQuery(e.target.value)}
    //             />
    //             <Button type="submit" disabled={loading || !query.trim() || documents.length === 0} className="w-full">
    //               {loading ? (
    //                 <>
    //                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    //                   Generating...
    //                 </>
    //               ) : (
    //                 <>
    //                   <Search className="mr-2 h-4 w-4" />
    //                   Generate Content
    //                 </>
    //               )}
    //             </Button>
    //           </form>
    //         </CardContent>
    //       </Card>
    //     </div>

      
    //   </div>
    // </main>
  )
}
