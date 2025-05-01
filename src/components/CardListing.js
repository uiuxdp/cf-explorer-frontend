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
import { SparklesCore } from "./ui/sparkles";
import Link from "next/link";

export default function CardListing({data1}) {
  console.log(data1,"listingggg");
  
  return (
    <div className=" bg-[#020001] relative pt-[200px]">
      <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[160px] rounded-full w-[1000px]  h-[500px] bg-gradient-to-br opacity-70 from-[#2b693a] to-[#00461e]"></div>

      <div className="container mx-auto">
        <div className="h-[24rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
          <h1 className="md:text-7xl text-3xl lg:text-7xl font-light text-center  relative z-20 mb-2 text-transparent bg-clip-text bg-gradient-to-t from-[#1c5028] to-[#ffffffe0]">
          CX Feedback <span className="font-normal inline-block relative text-[#b5ffece3]"> Ai  

          <div className="absolute w-[56%] -top-[33%] -right-[40%]">
                        <div className="aspect-square relative ">
                          <Image src={"/star.svg"} fill alt="" />
                        </div>

                        <div className="aspect-square absolute w-[50%] -top-[20%] -left-[30%]">
                          <Image src={"/star.svg"} fill alt="" />
                        </div>
                      </div>
          </span>
          </h1>
          <div className="w-[40rem] h-40 relative">
            {/* Gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#0a7e5c] to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#0a7e5c] to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#0ec791] to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#0ec791] to-transparent h-px w-1/4" />

            {/* Core component */}
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />

            {/* Radial Gradient to prevent sharp edges */}
            <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
          </div>
        </div>
        <div>
          <div className="border-b border-white/20 pb-3 mb-6 text-white font-bold text-5xl">
            2025
          </div>

          <div className="grid grid-cols-4 gap-4">
          {data1?.data?.map((item, i) => {
              return (
                <div key={i}>
               <Link href={`/${item?.slug}`} className="p-[30px] block border-2 border-white/20 rounded-[24px] relative overflow-hidden">
                    <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[40px] rounded-full w-[300px]  h-[200px] bg-gradient-to-br opacity-50 from-[#2b693a] to-[#00461e]"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-white/40">Title</p>
                        <h2 className="text-white text-xl">{item?.title}</h2>
                      </div>
                  
                    </div>
                   <div className="flex flex-wrap mt-12">
                    <div className="border border-[#005836] text-white px-[13px] py-[6px] rounded-full text-xs mr-[10px] mb-[10px]">Dubai Police Website</div>
                    <div className="border border-[#005836] text-white px-[13px] py-[6px] rounded-full text-xs mr-[10px] mb-[10px]">Dubai Police App</div>
                    <div className="border border-[#005836] text-white px-[13px] py-[6px] rounded-full text-xs mr-[10px] mb-[10px]">Dubai Police SPS</div>
                   </div>
                  </Link>
                </div>
              );
            })}
            {/* {data?.map((item, i) => {
              return (
                <div key={i}>
               <Link href={"/sdfsdf"} className="p-[30px] block border-2 border-white/20 rounded-[24px] relative overflow-hidden">
                    <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[40px] rounded-full w-[300px]  h-[200px] bg-gradient-to-br opacity-50 from-[#2b693a] to-[#00461e]"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-white/40">Quarter</p>
                        <h2 className="text-white text-4xl">Q1</h2>
                      </div>
                      <div className="text-end">
                        <p className="text-white/40">year</p>
                        <h2 className="text-white text-4xl">2025</h2>
                      </div>
                    </div>
                   <div className="flex flex-wrap mt-12">
                    <div className="border border-[#005836] text-white px-[13px] py-[6px] rounded-full text-xs mr-[10px] mb-[10px]">Dubai Police Website</div>
                    <div className="border border-[#005836] text-white px-[13px] py-[6px] rounded-full text-xs mr-[10px] mb-[10px]">Dubai Police App</div>
                    <div className="border border-[#005836] text-white px-[13px] py-[6px] rounded-full text-xs mr-[10px] mb-[10px]">Dubai Police SPS</div>
                   </div>
                  </Link>
                </div>
              );
            })} */}

          
          </div>
        </div>

        {/* <div>
          <div className="border-b border-white/20 pb-3 mb-6 text-white font-bold text-5xl">
            2025
          </div>

          <div className="grid grid-cols-4 gap-4">
            {data?.map((item, i) => {
              return (
                <div key={i}>
                  <Link href={"/sdfsdf"} className="p-[30px] block border-2 border-white/20 rounded-[24px] relative overflow-hidden">
                    <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 filter blur-[40px] rounded-full w-[300px]  h-[200px] bg-gradient-to-br opacity-50 from-[#2b693a] to-[#00461e]"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-white/40">Quarter</p>
                        <h2 className="text-white text-4xl">Q1</h2>
                      </div>
                      <div className="text-end">
                        <p className="text-white/40">year</p>
                        <h2 className="text-white text-4xl">2025</h2>
                      </div>
                    </div>
                    <p></p>
                  </Link>
                </div>
              );
            })}

            <div>q2</div>
            <div>q3</div>
            <div>q4</div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

const data = [{}, {}, {}, {}];
