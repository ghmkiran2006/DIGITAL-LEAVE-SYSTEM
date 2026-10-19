# BITM Smart Leave Management & Verification System

A secure, multi-institution digital leave management and QR verification platform built with **React + Vite** (frontend) and **Express.js + Node.js (SQLite)** (backend).

---

## 🚀 Architecture Overview

- **Frontend (`client/`)**: React (Vite), Lucide Icons, Canvas Confetti, HTML5 QR Code scanner, responsive PWA support.
- **Backend (`server/`)**: Express.js REST API, SQLite (`node:sqlite`) database, JWT Authentication, Multer for document/proof uploads, QR code generator.

---

## 🔐 Default Authority Credentials

- **Email**: `BITM@gmail.com`
- **Password**: `BITM1234`

*(No student self-registration; all student accounts are provisioned exclusively by the Authority).*

---

## 🛠 Local Setup & Running

### 1. Backend Server
```bash
cd server
npm install
npm run dev
# Running on http://localhost:4000
```

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 🌐 Deploying to Production & Making the URL Public

### Method 1: Deploy Frontend on Vercel + Backend on Render/Railway (Recommended for Full Database Persistence)

Because the backend utilizes a persistent SQLite database and static file uploads, the best industry practice is:

1. **Deploy Backend**:
   - Push your code to GitHub.
   - Go to [render.com](https://render.com) (or Railway / Koyeb).
   - Create a **New Web Service** pointing to your repository.
   - Set **Root Directory**: `server`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`
   - Copy your public service URL (e.g., `https://bitm-leave-backend.onrender.com`).

2. **Deploy Frontend on Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
   - Import your GitHub repository.
   - Set **Root Directory**: `client`
   - Framework Preset: **Vite**
   - In **Environment Variables**, add:
     - `VITE_API_BASE_URL` = `https://bitm-leave-backend.onrender.com`
   - Click **Deploy**.
   - Your frontend will be live on `https://your-project.vercel.app`!

---

## 📄 License
Educational & Institutional Use Only.
