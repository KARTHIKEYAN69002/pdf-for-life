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
        <div className="result-loading-inner">
          <div className="result-spinner">
            <Loader size={28} />
          </div>
          <p className="result-loading-title">Processing your file…</p>
          <p className="result-loading-sub">{message || 'This may take a moment. Please wait.'}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="result-success-inner">
          <div className="result-success-icon">
            <CheckCircle size={28} />
          </div>
          <p className="result-success-title">Done! Your file is ready.</p>
          {extra && <p className="result-success-sub">{extra}</p>}
          {url && (
            <a
              className="result-download-btn"
              href={getDownloadUrl(url)}
              download={filename}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={18} />
              Download File
            </a>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="result-error-inner">
          <div className="result-error-icon">
            <AlertCircle size={28} />
          </div>
          <p className="result-error-title">Something went wrong</p>
          <p className="result-error-sub">{error || 'Unknown error. Please try again.'}</p>
        </div>
      )}
    </div>
  );
}
