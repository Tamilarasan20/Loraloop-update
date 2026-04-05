# Loraloop — Autonomous AI marketting Team/Company
Loraloop is a next-generation platform for digital presence, combining AI-driven Brand DNA extraction with a powerful multi-platform social media scheduler, publisher, and analytics engine.

## 🏗️ Repository Structure

- **`/loraloop-app`** — The core Next.js 16 application (App Router, TypeScript, Tailwind CSS).
- **`/docs`** — Project documentation and research materials.
- **`docker-compose.yml`** — Infrastructure for the self-hosted Postiz backend.
- **`setup-postiz.sh`** — Automated setup script for the full developer stack.

## 🚀 Quick Start

### 1. Requirements
- **Node.js 18+**
- **Docker Desktop** (for self-hosted social media backend)

### 2. Infrastructure Setup (Postiz Backend)
The social media features (scheduling, analytics, automation) require the Postiz backend.
```bash
./setup-postiz.sh
```
This script will:
- Check for Docker and Docker Compose.
- Create your `.env.postiz` file.
- Start the full stack (AppServer, PostgreSQL, Redis, Temporal).

### 3. Application Setup
```bash
cd loraloop-app
npm install
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🎨 Brand DNA Tool
Reverse-engineers any brand by analyzing their website.
- Extraction of colors, typography, and visual assets.
- AI-driven analysis of brand values, voice, and positioning.
- Real-time previews of extracted components.

## 📱 Social Media Platform
Full-stack social media management integrated via [Postiz](https://postiz.com).
- **Multi-Platform Publisher**: Compose once, post to Instagram, X, LinkedIn, TikTok, and more.
- **Scheduling Engine**: Visual calendar grid with queue management.
- **Advanced Analytics**: Engagement tracking and performance insights.
- **Team Collaboration**: Member roles with approval workflows.
- **Automation Hub**: Custom trigger-action rules for social engagement.

---

## 🔐 Environment Variables

- **`.env.local`** (in `loraloop-app/`): Application-specific secrets (Gemini API key).
- **`.env.postiz`** (in root): Social media platform OAuth keys (X, Meta, LinkedIn).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (Turbopack), TypeScript, Lucide Icons, Vanilla CSS Design System.
- **AI**: Google Gemini Pro (Brand Extraction), Postiz AI (Content Suggestions).
- **Backend Infrastructure**: Postiz (Self-hosted via Docker), Temporal (Workflow Engine), PostgreSQL, Redis.
