import ChatInterface from "@/components/Completion";
import { getSingleFeedback } from "@/lib/getPages";
import Image from "next/image";



export default async function Home({params}) {
  const { slug } = await params;
  const data= await getSingleFeedback(slug)
  
  return (
    // <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <ChatInterface data={data} />
    // </div>
  );
}
