import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File } from 'lucide-react';
import './DropZone.css';

export default function DropZone({ onFiles, accept, multiple = false, label, hint, files }) {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length) onFiles(acceptedFiles);
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || { 'application/pdf': ['.pdf'] },
    multiple,
  });

  return (
    <div className="dropzone-wrapper">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${files && files.length ? 'has-files' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="dropzone-icon">
            <Upload size={24} />
          </div>
          <p className="dropzone-label">{isDragActive ? 'Release to upload' : (label || 'Drag & drop PDF here')}</p>
          <p className="dropzone-hint">{hint || 'or click to browse'} · Max 50MB</p>
        </div>
      </div>
      {files && files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className="file-item">
              <File size={14} />
              <span className="file-name">{f.name}</span>
              <span className="file-size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
