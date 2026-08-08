# FarmFleet AI

**Smart Agricultural Equipment Rental & AI-Based Crop Planning Platform**

FarmFleet AI is a smart agriculture platform that combines an equipment rental marketplace, AI-powered crop planning, weather intelligence, digital farming reports, and secure online payments into a single farmer-friendly ecosystem. It is built for Indian farmers, with a simple interface, multilingual support, and practical AI recommendations rather than technical agricultural reports.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Core Modules](#core-modules)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Future Scope](#future-scope)
- [License](#license)

---

## Overview

Unlike traditional equipment rental platforms, FarmFleet AI acts as a digital farming assistant. It helps farmers make informed cultivation decisions while also giving them access to agricultural machinery and labour whenever required. The platform is designed to be simple, mobile-first, and practical for real-world use by farmers.

---

## Problem Statement

Indian farmers face multiple challenges throughout the cultivation cycle:

- Difficulty in finding farm equipment nearby
- High equipment ownership costs
- Lack of scientific crop planning
- Unpredictable weather conditions
- Poor access to verified farm labour
- Limited awareness of modern farming practices
- Time-consuming manual planning
- Difficulty tracking cultivation activities
- Fragmented agricultural services

FarmFleet AI addresses all of these problems through one integrated platform.

---

## Core Modules

### 1. AI Smart Crop Planner
The farmer provides Crop, State, District, Soil Type, Land Area, Water Source, and Budget. The AI then generates a personalized cultivation guide covering:
- Crop duration
- Best cultivation season
- Seed recommendation
- Land preparation checklist
- Week-wise farming calendar
- Fertilizer schedule
- Irrigation schedule
- Pest and disease management
- Weed management
- Labour requirements
- Equipment recommendations
- Precautions and expert farming tips
- Weather-based recommendations

Every itinerary generated is stored in MongoDB.

### 2. Equipment Rental Marketplace
Farmers can search nearby agricultural equipment, including Tractor, Rotavator, Cultivator, Seed Drill, Sprayer, Harvester, Plough, Thresher, and Power Weeder. Each listing contains images, description, rental price, owner information, availability, and a booking option.

### 3. Equipment Owner Portal
Equipment owners can register machinery, upload images, set rental prices, manage availability, accept or reject bookings, view earnings, track bookings, and manage their profile.

### 4. Labour Marketplace
Farmers can search verified labour, view worker profiles, contact labour, and hire nearby workers.

### 5. Online Booking System
Provides real-time booking, booking history, booking status tracking, equipment availability checking, and an owner approval workflow.

### 6. Payment Gateway Integration
Secure online transactions with booking confirmation after payment, digital payment records, and transaction history. Refunds and wallet integration are planned for the future.

### 7. AI Weather Intelligence
Live weather information including temperature, humidity, weather condition, rain probability, and AI-generated farming recommendations (e.g., delay irrigation before rainfall, complete fertilizer application before rain, avoid pesticide spraying during strong winds).

### 8. Smart Farming Calendar
Converts cultivation activities into an easy-to-follow, week-wise schedule with milestones, equipment/labour requirements, and reminders.

### 9. AI Report Generation
Generates a professional digital farming guide covering farm summary, crop details, weekly calendar, irrigation guide, fertilizer schedule, equipment recommendations, labour plan, pest/weed management, weather recommendations, and expert tips.

### 10. PDF Report Generation
Generates a professional, print-ready PDF report directly from the backend with FarmFleet branding, structured tables, and direct download support.

### 11. AI Processing Workflow
While an itinerary is being generated, the user sees an interactive processing screen showing AI progress stages (understanding crop, analysing soil, checking district conditions, fetching weather, selecting seed variety, creating cultivation timeline, preparing the final guide).

### 12. Notifications
Intelligent notifications for heavy rainfall alerts, irrigation reminders, fertilizer reminders, harvest reminders, and weather warnings — delivered via email, with SMS/push planned for the future.

### 13. Authentication
Role-based authentication for:
- **Farmer** — Email OTP verification, JWT authentication
- **Equipment Owner** — Secure login, equipment management
- **Labour** — Profile and availability management

### 14. Dashboard
A personalized dashboard with equipment search, labour search, booking management, AI dashboard, generated reports, weather insights, and the farming calendar.

---

## Key Features

- AI-powered personalized crop planning
- Farm equipment rental marketplace
- Verified labour hiring
- Online equipment booking
- Secure payment gateway
- AI weather recommendations
- Smart farming calendar
- Digital cultivation reports
- Backend PDF generation
- Email notifications
- Responsive, farmer-friendly interface
- Multi-role authentication
- Mobile-first design
- Printable farming guides
- Scalable architecture

---

## Technology Stack

### Frontend
- React 19
- TypeScript
- TanStack Router
- React Query
- Tailwind CSS
- Framer Motion
- React Hook Form
- Axios
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Nodemailer
- PDFKit
- Cloudinary
- Multer

### AI
- Google Gemini API
- AI Prompt Engineering
- Weather-based AI Recommendations
- Personalized Crop Planning

### Database (MongoDB Collections)
- Farmers
- Equipment
- Equipment Owners
- Labour
- Bookings
- AI Itineraries
- Payments
- Notifications

---

## Folder Structure

```
FarmFleet-AI/
├── backend/
│   ├── config/               # Database and app configuration
│   ├── controllers/          # Route controllers / business logic
│   ├── cron/                 # Scheduled/cron jobs
│   ├── generated-reports/    # Generated PDF farming reports
│   ├── jobs/                 # Background job handlers
│   ├── middleware/           # Express middleware (auth, error handling, etc.)
│   ├── models/               # Mongoose schemas/models
│   ├── node_modules/
│   ├── routes/                # API route definitions
│   ├── services/              # Business/service layer (AI, weather, payments, etc.)
│   ├── utils/                 # Helper/utility functions
│   ├── .env                   # Backend environment variables
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js               # Backend entry point
│   └── test.js
│
├── node_modules/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable frontend components
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Internationalization / multilingual support
│   ├── lib/                    # Frontend utility/library code
│   ├── routes/
│   │   ├── router.tsx
│   │   ├── route.tree.gen.ts
│   │   ├── server.ts
│   │   └── start.ts
│   └── styles.css
│
├── .gitignore
├── .prettierignore
├── .prettierrc
├── components.json
├── eslint.config.js
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB (local instance or a hosted cluster such as MongoDB Atlas)
- A Google Gemini API key
- A Cloudinary account (for image uploads)
- SMTP credentials (for email/OTP via Nodemailer)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/FarmFleet-AI.git
   cd FarmFleet-AI
   ```

2. Install frontend dependencies (project root)
   ```bash
   npm install
   ```

3. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

4. Set up environment variables (see [Environment Variables](#environment-variables) below) in `backend/.env`

5. Run the backend server
   ```bash
   cd backend
   npm start
   ```

6. Run the frontend (from the project root, in a separate terminal)
   ```bash
   npm run dev
   ```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory. Typical variables required by this stack include:

```
PORT=
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
WEATHER_API_KEY=
```

> Update the values above according to your own credentials and services. Never commit your actual `.env` file to version control.

---

## Available Scripts

**Frontend (project root):**
- `npm run dev` — Start the frontend development server
- `npm run build` — Build the frontend for production

**Backend (`backend/` directory):**
- `npm start` — Start the backend server

> Exact script names may vary slightly depending on the final `package.json` configuration — refer to the respective `package.json` files for the authoritative list.

---

## Future Scope

- Voice-based interaction in regional languages
- Image-based crop disease detection
- IoT sensor integration for real-time farm monitoring
- Drone and satellite data integration
- Market price prediction
- Crop yield analytics
- Government scheme recommendations
- Offline mode for low-connectivity areas
- Mobile application for Android and iOS

---

## Project Outcome

FarmFleet AI is more than an equipment rental platform — it is an integrated smart farming ecosystem. By combining AI-driven crop planning, weather-aware recommendations, machinery and labour marketplaces, secure online payments, and downloadable farming guides, it helps farmers plan, book, pay, and manage their cultivation activities from a single platform. The focus throughout the project is on making advanced technology accessible through a simple, practical, and user-friendly experience tailored to the needs of Indian farmers.

---
