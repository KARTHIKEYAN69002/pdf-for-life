# 📄 PDF for Life

> Every PDF tool you'll ever need — free, private, and open source.

**Live demo**: [your-deployment-url.vercel.app]  
**Backend API**: [your-api.onrender.com]

---

## ✨ Features

| Tool | Description |
|------|-------------|
| 🔗 Merge PDFs | Combine multiple PDFs into one |
| ✂️ Split PDF | Split into pages or ranges → ZIP |
| 🗜️ Compress PDF | Reduce file size with object streams |
| 🔄 Rotate PDF | Rotate all or specific pages |
| 💧 Add Watermark | Diagonal text watermark on all pages |
| 🗑️ Remove Pages | Delete specific pages by number |
| 🖼️ Extract Images | Pull embedded images → ZIP |
| ✍️ Sign PDF | Add italic text signature |
| 📝 Word → PDF | Convert .docx to PDF via text rendering |
| 📄 PDF → Word | Extract PDF text to .docx |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/pdf-for-life.git
cd pdf-for-life

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000/api/pdf
REACT_APP_API_BASE=http://localhost:5000
```

### 3. Run Development Servers

Open two terminals:

```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 3000)
npm run dev:frontend
```

Visit **http://localhost:3000**

---

## 🌐 Deployment

### Frontend → Vercel (Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo, set **Root Directory** to `frontend`
4. Add environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api/pdf
   REACT_APP_API_BASE=https://your-backend.onrender.com
   ```
5. Deploy ✓

### Backend → Render (Free)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
4. Add environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. Deploy ✓

> ⚠️ **Note**: Render free tier spins down after 15 minutes of inactivity. First request may take ~30s to wake up. Consider adding a ping service like [cron-job.org](https://cron-job.org) to keep it warm.

### Alternative: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
cd backend
railway up
```

---

## 🏗️ Project Structure

```
pdf-for-life/
├── backend/
│   ├── middleware/
│   │   └── upload.js          # Multer config (50MB limit, type filter)
│   ├── routes/
│   │   └── pdf.js             # All 10 PDF operation endpoints
│   ├── uploads/               # Temp uploaded files (auto-deleted)
│   ├── temp/                  # Processed output files (auto-deleted)
│   ├── server.js              # Express app + rate limiting + cron cleanup
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx      # Sticky header + dark/light toggle
│   │   │   ├── DropZone.jsx    # react-dropzone wrapper
│   │   │   ├── ResultCard.jsx  # Success/error/loading feedback
│   │   │   └── ToolLayout.jsx  # Shared tool page shell
│   │   ├── context/
│   │   │   └── ThemeContext.js # Dark/light mode state
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Tool grid + features + how-it-works
│   │   │   ├── MergePDF.jsx
│   │   │   ├── SplitPDF.jsx
│   │   │   ├── CompressPDF.jsx
│   │   │   ├── RotatePDF.jsx
│   │   │   ├── WatermarkPDF.jsx
│   │   │   ├── RemovePages.jsx
│   │   │   ├── ExtractImages.jsx
│   │   │   ├── SignPDF.jsx
│   │   │   ├── WordToPDF.jsx
│   │   │   └── PDFToWord.jsx
│   │   ├── utils/
│   │   │   └── api.js          # Axios instance + helpers
│   │   ├── App.jsx             # Router + layout
│   │   └── index.css           # Global styles + CSS variables
│   └── package.json
│
├── package.json                # Root scripts (install:all, dev:*)
└── README.md
```

---

## 🔒 Security

- **Rate limiting**: 100 requests per 15 minutes per IP
- **File size limit**: 50MB maximum upload
- **File type validation**: Only PDF, DOCX, DOC accepted
- **Auto cleanup**: Files deleted after 1 hour via cron job
- **CORS**: Restricted to configured frontend URL
- **Helmet**: Security headers on all responses

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Tailwind (via CSS vars) |
| Backend | Node.js 18, Express 4 |
| PDF Engine | pdf-lib (read/write/manipulate PDFs) |
| File Upload | Multer (multipart/form-data) |
| DOCX Parsing | Mammoth (Word → HTML → PDF) |
| Archiving | Archiver (ZIP output for split/images) |
| Cleanup | node-cron (hourly sweep) |
| Security | Helmet + express-rate-limit |

---

## 📝 API Reference

All endpoints accept `multipart/form-data` and return JSON.

| Method | Endpoint | Fields | Returns |
|--------|----------|--------|---------|
| POST | `/api/pdf/merge` | `files[]` (2+) | `{url, filename}` |
| POST | `/api/pdf/split` | `file`, `ranges?` | `{url, filename}` (ZIP) |
| POST | `/api/pdf/compress` | `file` | `{url, originalSize, compressedSize}` |
| POST | `/api/pdf/rotate` | `file`, `angle`, `pages?` | `{url, filename}` |
| POST | `/api/pdf/watermark` | `file`, `text`, `opacity`, `fontSize`, `color` | `{url}` |
| POST | `/api/pdf/remove-pages` | `file`, `pages` | `{url}` |
| POST | `/api/pdf/extract-images` | `file` | `{url, imageCount}` (ZIP) |
| POST | `/api/pdf/sign` | `file`, `signatureText`, `page`, `x`, `y`, `fontSize` | `{url}` |
| POST | `/api/pdf/word-to-pdf` | `file` (.docx) | `{url}` |
| POST | `/api/pdf/pdf-to-word` | `file` (.pdf) | `{url}` |
| POST | `/api/pdf/info` | `file` | `{pageCount, width, height}` |

Downloaded files served from `/downloads/:filename`

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with open source ❤️ — no paid APIs, no sign-ups, no tracking.*
