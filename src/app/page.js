import ChatInterface from "@/components/Completion";
import Image from "next/image";
import CardListing from "../components/CardListing";
import nextFetch from "@/utils/nextFetch";
import { FEEDBACK_ITEMS } from "@/lib/constants";



export default async function Home() {
  const data=await nextFetch(FEEDBACK_ITEMS)
  return (
    // <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <CardListing data1={data}/>
    // </div>
  );
}
