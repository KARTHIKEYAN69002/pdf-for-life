import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api/pdf';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 min to handle cold starts + large files
});

export function getDownloadUrl(path) {
  const base = process.env.REACT_APP_API_BASE || '';
  return `${base}${path}`;
}

export async function uploadFiles(endpoint, files, fields = {}) {
  const formData = new FormData();
  if (Array.isArray(files)) {
    files.forEach(f => formData.append('files', f));
  } else if (files) {
    formData.append('file', files);
  }
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
