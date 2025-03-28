import { useState } from 'react';
import Button from './Button';
import { Upload } from 'react-feather';

const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB in bytes

export default function AudioUploader({ sendClientEvent }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const splitAudioFile = async (file) => {
    const chunks = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      chunks.push(chunk);
      offset += CHUNK_SIZE;
    }

    return chunks;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const chunks = await splitAudioFile(file);
      const totalChunks = chunks.length;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const formData = new FormData();
        formData.append('file', chunk, `chunk_${i + 1}_${file.name}`);

        // Send chunk for transcription
        const event = {
          type: 'audio.transcribe',
          item: {
            file: formData,
            chunk_number: i + 1,
            total_chunks: totalChunks,
          },
        };

        sendClientEvent(event);
        setProgress(((i + 1) / totalChunks) * 100);
      }
    } catch (error) {
      console.error('Error processing audio file:', error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-md">
      <h2 className="text-lg font-bold">Audio Transcription</h2>
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="audio-upload"
        />
        <label htmlFor="audio-upload">
          <Button
            icon={<Upload height={16} />}
            className={isUploading ? 'bg-gray-600' : 'bg-blue-400'}
          >
            {isUploading ? 'Processing...' : 'Upload Audio'}
          </Button>
        </label>
      </div>
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
} 