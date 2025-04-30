'use client'
import { useState, useRef } from 'react'

export default function Home() {
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunks = useRef([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    audioChunks.current = []

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
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">🎤 Whisper Local Transcription</h1>
      <div className="space-x-2">
        <button onClick={startRecording} className="px-4 py-2 bg-green-500 text-white rounded">Start</button>
        <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded">Stop</button>
      </div>
      <p><strong>Transcription:</strong> {transcript}</p>
    </div>
  )
}
