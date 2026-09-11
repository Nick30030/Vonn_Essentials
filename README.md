# Vonn Essentials — Handcrafted Skincare & Apothecary

Full-stack e-commerce store with natural essential oils skincare catalog, bilingual support (EN/FR), interactive 3D elements, Interac e-Transfer & PayPal checkout, PDF receipts, and integrated store management.

---

## 💻 Running in VS Code (Local Development)

### 1. Prerequisites
- **Node.js**: v18 or later (Node 20+ recommended)
- **npm**: v9 or later (comes with Node.js)

### 2. Setup
1. Clone or extract the project folder and open it in **VS Code**.
2. Open a terminal in VS Code (`Ctrl + \`` or `Cmd + \``).
3. Install dependencies:
   ```bash
   npm install
   ```
4. (Optional) Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *The app includes local fallback defaults for immediate out-of-the-box development!*

### 3. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser. Changes will update live.

### 4. Build & Production Test Locally
To test the production bundle locally:
```bash
npm run build
npm start
```

---

## 🚀 Deploying to Vercel

This repository is pre-configured with `vercel.json` for 1-click deployment on Vercel:

1. **Push to GitHub**:
   - Push your code to your GitHub repository.
2. **Import on Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"** > **"Import Git Repository"**.
   - Select your repository.
3. **Build & Output Settings**:
   - Vercel automatically detects the configuration from `package.json` and `vercel.json`:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
4. **Environment Variables**:
   - Under **Environment Variables**, add any production keys you need (refer to `.env.example`).
5. **Deploy**:
   - Click **Deploy**. Vercel will build both the frontend and the serverless `/api` endpoints automatically.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite 6, Tailwind CSS, Lucide Icons, Three.js / React Three Fiber, Framer Motion
- **Backend / API**: Express 4, Node.js serverless handler for Vercel, PDFKit / jsPDF receipt engine
- **Payments**: Interac e-Transfer verification, PayPal Checkout SDK

