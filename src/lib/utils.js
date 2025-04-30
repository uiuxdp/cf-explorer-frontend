import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import Papa from "papaparse";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export async function fetchSheetData() {
  const res = await fetch(
    "https://docs.google.com/spreadsheets/d/1OaMom2Zj6Ai5-JvMX-njXaFjNiXC6mjZ3feFg2soz74/export?format=csv&gid=804090704"
  );
  const csv = await res.text();
  // https://docs.google.com/spreadsheets/d/1OaMom2Zj6Ai5-JvMX-njXaFjNiXC6mjZ3feFg2soz74/edit?single=true&widget=true&headers=false&rm=minimal&gid=804090704#gid=804090704
  const [headersLine, ...lines] = csv.trim().split("\n");
  const headers = headersLine.split(",");

// console.log(csv,"csvcsvcsvcsvcsv");

  const { data } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const transformed = data.map((item) => {
    if (item.Date) {
      const [day, month, year] = item.Date.split("/");
      item.Date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return item;
  });
  // console.log(transformed, "jsonjsonjsonjson");


  return csv;

 
  // return data;
}


export function nanoid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
