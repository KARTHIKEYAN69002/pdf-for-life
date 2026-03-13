import React, { useState } from 'react';
import { Image } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function ExtractImages() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/extract-images', file);
      setResult({ status: 'success', url: data.url, filename: data.filename, extra: `Found ${data.imageCount} image${data.imageCount !== 1 ? 's' : ''}. Download as ZIP.` });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<Image size={24} />} title="Extract Images" color="#7c3aed"
      description="Extract all embedded images from a PDF and download them as a ZIP archive.">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />
      <button className="submit-btn" onClick={handleSubmit} disabled={!file || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Extracting…' : 'Extract Images'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
