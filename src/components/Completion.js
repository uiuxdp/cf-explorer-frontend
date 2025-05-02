"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { useChat } from "@ai-sdk/react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useState, useRef, useEffect } from "react";
import { HospitalCard } from "../../components/HospitalCard";
import { PoliceServiceCard } from "../../components/PoliceServiceCard";
import { GlowEffect } from "./ui/glow-effect";
import { GradientText } from "./ui/gradient-text";
import Image from "next/image";
import { TextShimmer } from "./ui/text-shimmer";
import EqualizerIcon from "./EqualizerIcon";

export default function ChatInterface({data}) {
  // const [messages, setMessages] = useState([]);
  // const [input, setInput] = useState("");
  // const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioChunksRef = useRef([]);

  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunks = useRef([])

const bodyData=data?.data

  const { messages, input,setInput, isLoading, handleInputChange, handleSubmit } =
    useChat({
      api: "/api/chat",
      body: { bodyData },
    });


    const startRecording = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream)
        audioChunks.current = []
        setIsRecording(true)
        mediaRecorder.ondataavailable = e => {
          audioChunks.current.push(e.data)
        }
    
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
          const formData = new FormData()
          formData.append('file', audioBlob, 'recording.wav')
    
          const res = await fetch('http://localhost:8001/transcribe', {
            method: 'POST',
            body: formData,
          })
    
          const data = await res.json()
          setTranscript(data.text)
          setInput(data.text)
     console.log(data,"datain");
     
         
        }
    
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
      } else {
        console.error("getUserMedia not supported or not running in a browser");
      }
      // const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  
    }
  
    const stopRecording = () => {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
     
    }


    useEffect(()=>{
      if(!isRecording&&transcript){
        handleSubmit()
      }

    },[isRecording, transcript])

  return (
    <div className=" bg-[#020001] relative">
      <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[160px] rounded-full w-[1000px]  h-[500px] bg-gradient-to-br opacity-70 from-[#2b693a] to-[#00461e]"></div>

      {/* Left Sidebar */}
      {/* Main Content */}
      <div className="flex min-h-screen  z-10 relative ">
        <div className="flex-1 flex flex-col h-screen w-[800px] overflow-hidden sticky top-0 gap-7 p-8 ">
          {/* Chat Area */}
          {/* <div className="absolute -bottom-[90%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[160px] rounded-full w-[1000px]  h-[500px] bg-gradient-to-br opacity-70 from-[#2b693a] to-[#00461e]"></div> */}
          {/* <div className="absolute top-0 left-[60%]  -translate-y-1/2 filter blur-[160px] rounded-full w-[600px]  h-[500px]  bg"></div> */}
          <div className="flex-1 flex overflow-hidden  gap-5 relative z-10">
            <div className="flex-1 flex flex-col overflow-hidden   rounded-lg max-w-[800px] mx-auto">
              <div className="p-4 flex flex-col h-full">
                {messages?.length <= 0 && (
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
                )}

                <ScrollArea className="flex-1 ">
                  {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                      Error: {error}
                    </div>
                  )}
                  {console.log(messages, "messagesmessagesmessages")}
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === "user" ? (
                        <div className="mb-6">
                          <div className="flex gap-3 mb-3">
                            {/* <Avatar className="h-8 w-8">
                            <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-30%20at%207.51.38%E2%80%AFPM-xaPUwKfWTkYwpcPasYsk0x0gucxecP.png" />
                            <AvatarFallback>US</AvatarFallback>
                          </Avatar> */}

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
                                {/* {message.toolInvocations?.length > 0 && (
                                  <ReactMarkdown>
                                    {message?.toolInvocations[0]?.result?.text}
                                  </ReactMarkdown>
                                )} */}
                                {/* <p
                                className=""
                                dangerouslySetInnerHTML={{
                                  __html: message.content,
                                }}
                              /> */}
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
                    </div>
                  ))}
                  {isLoading && (
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
                        className="text-xl font-medium [--base-color:theme(colors.green.600)] [--base-gradient-color:theme(colors.green.200)] dark:[--base-color:theme(colors.green.700)] dark:[--base-gradient-color:theme(colors.green.400)]"
                      >
                        Just a sec...
                      </TextShimmer>
                    </div>
                  )}
                </ScrollArea>

                {/* Regenerate Button */}

                <div className="flex justify-start overflow-x-auto gap-2 my-4">
                  {metadata?.analysis?.recommendedQuestions?.map((item, i) => {
                    return (
                      <>
                        <Button
                          // onClick={() => setQueuedInput(item)}
                          variant="outline"
                          className="w-[40%] me-3 flex-initial whitespace-normal text-left h-auto rounded-xl border-[#0d9056] bg-gradient-to-br from-[#0f8d54] to-[#062819] text-white flex-grow-0 flex-shrink-0 flex-basis-auto"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {item}
                        </Button>
                      </>
                    );
                  })}
                </div>

                {/* Input Area */}
                <div
                  className="rounded-lg p-4 border border-[#adfcda94] bg-[#dfdfdf1a] shadow-[0px_0px_14px_0px_#097647]"
                  style={{ position: "sticky", bottom: 0 }}
                >
                  <form
                    onSubmit={handleSubmit}
                    className="mt-4 flex items-center gap-2"
                  >
                    {/* <p className="text-white">{transcript}</p> */}
                    <Input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      className="border-0 bg-transparent text-white focus-visible:ring-0 px-0 flex-1"
                      placeholder="Ask or search anything"
                      // onChange={(event) => setInput(event.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className=" bg-white rounded-full"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                             {/* <button onClick={startRecording} className="px-4 py-2 bg-green-500 text-white rounded">Start</button> */}
                             {/* <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded">Stop</button> */}
                      {isRecording ? (
                        <>
                            <EqualizerIcon />
                            {/* <MicOff className="w-4 h-4 text-red-500" /> */}
                        </>
                       
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            {/* <div className="w-80 p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recommended Actions</h2>
              {metadata?.analysis?.emergencyContact && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => (window.location.href = "tel:999")}
                >
                  <Lightning className="w-4 h-4 mr-2" />
                  Call {metadata?.analysis?.emergencyContact}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[calc(100vh-200px)]">
              {metadata?.analysis?.urgencyMessage && (
                <div
                  className="mb-4 p-3 rounded-lg text-center font-medium"
                  style={{
                    backgroundColor: `${metadata.analysis.severityColor}15`,
                    color: metadata.analysis.severityColor,
                    border: `1px solid ${metadata.analysis.severityColor}`,
                  }}
                >
                  {metadata.analysis.urgencyMessage}
                </div>
              )}

              <div className="space-y-4">
                {metadata?.analysis?.recommendedActions?.map(
                  (action, index) => (
                    <PoliceServiceCard
                      key={index}
                      policeService={{
                        name: action.service,
                        category: action.category,
                        nextSteps: action.nextSteps,
                      }}
                      requirements={metadata.analysis.requiredDocuments}
                      severity={metadata.analysis.priority}
                      borderColor={metadata.analysis.severityColor}
                    />
                  )
                )}

                {!metadata?.analysis?.recommendedActions && (
                  <div className="text-center text-gray-500 py-8">
                    Start a chat to get police service recommendations
                  </div>
                )}
              </div>
            </ScrollArea>
            
          </div> */}
          </div>
        </div>
        {console.log(data,"datadatadata")}
        {data?.data?.insights?.length>0&&
        <div className="flex-1 pt-24 pe-20 max-w-[1000px]">

          {data?.data?.insights?.map((item,i)=>{
            return(

          <div className="p-5 bg-white/15 rounded-3xl mb-4">
          <h3 className="text-white text-3xl font-bold mb-2">
            {item?.title}
          </h3>
          <p className="text-white mb-6">
           {item?.description}
          </p>
          <div className="aspect-[645/450] relative rounded-3xl overflow-hidden" style={{aspectRatio:item?.width/item?.height}}>
            <iframe
              width={item?.width}
              height={item?.height}
              src={item?.link}
              frameBorder="0"
              className="border-0  absolute top-0 left-0 w-full h-full"
              allowFullScreen=""
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            ></iframe>
          </div>
        </div>
            )
          })}
        </div>
        }
      </div>
    </div>
  );
}


{/* <iframe src="https://lookerstudio.google.com/embed/reporting/edcb0b6e-6bdd-4538-a941-c0b63ff1421f/page/gcVsD" loading="lazy" fetchpriority="auto" referrerpolicy="no-referrer" sandbox="allow-same-origin allow-scripts allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" style="width: 100%; height: 100%; border: none;"></iframe> */}



const data=[
  {
    title:"Services feedback volumen / Sentiment analysis score",
    description:"Happiness Meter - Digital Dubai - Dataset used for analysis.",
    url:"https://lookerstudio.google.com/embed/reporting/3ac54537-9427-4557-ae26-251c425339e4/page/p_nrws9zzzed",
    ratio:213/211,
  },
  {
    title:"Services feedback volumen / Sentiment analysis score",
    description:"Happiness Meter - Digital Dubai - Dataset used for analysis.",
    url:"https://lookerstudio.google.com/embed/reporting/edcb0b6e-6bdd-4538-a941-c0b63ff1421f/page/gcVsD",
    ratio:213/211,
  }
]
