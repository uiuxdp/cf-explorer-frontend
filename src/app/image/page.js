"use client"
import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [plate, setPlate] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8002/detect-plate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPlate(data.plate || []);
    } catch (err) {
      console.error("Upload failed", err);
    }

    setLoading(false);
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">License Plate Reader</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0])}
        className="mb-4"
      />
      <button onClick={handleUpload} disabled={!file || loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Detecting..." : "Upload & Detect"}
      </button>

      {plate.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Detected Plate(s):</h2>
          <ul className="list-disc ml-6 mt-2">
            {plate.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
