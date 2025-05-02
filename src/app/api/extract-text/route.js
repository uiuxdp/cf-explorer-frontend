import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  debugger

  const form = formidable({ keepExtensions: true });

  const files = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });

  const pdfFile = files.file?.[0];

  if (!pdfFile) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = fs.readFileSync(pdfFile.filepath);

  try {
    const pdfData = await pdfParse(buffer);
    return NextResponse.json({ text: pdfData.text });
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
