"use server";

// Function to process CSV content into headers and rows
export function processCSV(csvContent) {
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

  const headers = lines[0].split(",").map((header) => header.trim());

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(",");

    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    rows.push(row);
  }

  return {
    headers,
    rows,
  };
}

// Convert a single CSV row into a natural language sentence
export function csvRowToText(row, headers) {
  return headers.map((header) => `${header}: ${row[header]}`).join(". ");
}

// Generate a basic summary of the CSV file
export function generateCSVSummary(headers, rowCount) {
  return `This is a CSV file with ${rowCount} rows and the following columns: ${headers.join(", ")}.`;
}

// Extract sentiment and score from a row (if available)
export function extractSentiment(row) {
  const sentimentColumn = row["Sentiment"] || row["sentiment"] || row["SENTIMENT"] || null;
  const scoreColumn = row["Sentan"] || row["Score"] || row["score"] || row["SCORE"] || null;

  let score = null;
  if (scoreColumn) {
    const parsed = Number.parseFloat(scoreColumn);
    if (!isNaN(parsed)) {
      score = parsed;
    }
  }

  return {
    sentiment: sentimentColumn || "Unknown",
    score,
  };
}
