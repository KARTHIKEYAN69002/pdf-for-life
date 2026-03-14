import React from 'react';
import { Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getDownloadUrl } from '../utils/api';
import './ResultCard.css';

export default function ResultCard({ state }) {
  if (!state) return null;
  const { status, url, filename, error, message, extra } = state;

  return (
    <div className={`result-card result-${status}`}>
      {status === 'loading' && (
        <>
          <div className="result-icon spinning"><Loader size={20} /></div>
          <div className="result-body">
            <p className="result-title">Processing your file…</p>
            <p className="result-sub">{message || 'This may take a moment for large files.'}</p>
          </div>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="result-icon"><CheckCircle size={20} /></div>
          <div className="result-body">
            <p className="result-title">Done! Your file is ready.</p>
            {extra && <p className="result-sub">{extra}</p>}
          </div>
          {url && (
            <a className="result-download" href={getDownloadUrl(url)} download={filename} target="_blank" rel="noreferrer">
              <Download size={15} />
              Download
            </a>
          )}
        </>
      )}
      {status === 'error' && (
        <>
          <div className="result-icon"><AlertCircle size={20} /></div>
          <div className="result-body">
            <p className="result-title">Something went wrong</p>
            <p className="result-sub">{error || 'Unknown error occurred.'}</p>
          </div>
        </>
      )}
    </div>
  );
}
