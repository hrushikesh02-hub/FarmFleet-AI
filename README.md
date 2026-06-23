# FarmFleet

A full-stack farm equipment rental marketplace that connects farmers with equipment owners across India.

---

## Overview

FarmFleet is a role-based, full-stack web application built to modernize agricultural equipment access in India. The platform serves two distinct user roles — farmers who need equipment and owners who have equipment to rent. FarmFleet enables discovery, booking, listing management, earnings tracking, and review workflows through a single unified marketplace.

The application is built with React 19 and TypeScript on the frontend, powered by a Node.js and Express.js REST API backend, and uses MongoDB Atlas as its primary database.

---

## Problem Statement

Agricultural mechanization in India remains uneven. Small and marginal farmers — who make up over 85% of the farming community — often cannot afford to purchase or maintain expensive machinery such as tractors, harvesters, rotavators, and irrigation pumps. Meanwhile, equipment owners and larger farms routinely have machinery sitting idle for significant portions of the year.

This mismatch creates a dual inefficiency: farmers struggle with low productivity due to lack of access to modern tools, and equipment owners lose potential rental income on underutilized assets.

---

## Solution

FarmFleet bridges this gap through a structured digital marketplace with the following core design decisions:

- Separate onboarding flows and dashboards for farmers and equipment owners
- Equipment discovery with search and filtering to help farmers find relevant machinery
- A structured booking lifecycle with owner approval, rejection, and completion controls
- An earnings dashboard giving owners visibility into rental income
- Review and rating systems to build trust between marketplace participants
- Email notifications at key booking lifecycle events
- Multilingual support to reach users across different regions of India
- Cloudinary-based image uploads for equipment listings

---

## Features

### Farmer

| Feature | Description |
|---|---|
| Registration and Login | Secure account creation with role-based onboarding |
| Email OTP Verification | One-time password verification via email on registration |
| Equipment Search | Search and filter available equipment by type, location, or availability |
| Equipment Booking | Submit rental booking requests with desired dates and details |
| Booking History | View past and current bookings with status tracking |
| Reviews and Ratings | Submit ratings and written reviews after completed rentals |
| Profile Management | Update personal information and account settings |

### Equipment Owner

| Feature | Description |
|---|---|
| Registration and Login | Dedicated owner account creation with role-specific flows |
| Equipment Listing | List machinery with descriptions, pricing, images, and availability |
| Equipment Management | Edit, deactivate, or remove existing listings |
| Booking Management | View all incoming booking requests across listed equipment |
| Accept / Reject Bookings | Approve or decline rental requests from farmers |
| Mark as Completed | Update booking status upon equipment return |
| Earnings Dashboard | Visualize rental revenue and booking history |
| Reviews Dashboard | View ratings and feedback received from farmers |
| Profile Management | Update business and personal account details |

### Platform

| Feature | Description |
|---|---|
| Role-Based Authentication | Separate access controls and views for farmers and owners |
| JWT Authentication | Stateless, token-based authentication with secure storage |
| Cloudinary Image Uploads | Cloud-hosted image storage for equipment listing photos |
| Email Notifications | Automated transactional emails via Nodemailer |
| Responsive Design | Mobile-first UI that works across screen sizes |
| Multi-language Support | i18next-based internationalization for regional language access |

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | Component-based UI framework |
| TypeScript | Static typing and developer tooling |
| Vite | Fast build tooling and development server |
| Tailwind CSS | Utility-first CSS framework |
| ShadCN UI | Accessible, composable UI component library |
| Framer Motion | Animation and transition library |
| React Query | Server state management and data fetching |
| React Hook Form | Performant form state management and validation |
| TanStack Router | Type-safe, file-based client-side routing |
| i18next | Internationalization and localization |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Minimal web framework for REST API |
| MongoDB Atlas | Cloud-hosted NoSQL document database |
| Mongoose | ODM for schema definition and MongoDB queries |
| JWT | Stateless authentication tokens |
| Nodemailer | SMTP-based email sending |
| Cloudinary | Cloud image storage and transformation |

---

## System Architecture

```
Client (React + TypeScript)
        |
        | HTTPS / REST
        v
Express.js REST API (Node.js)
        |
        |-- JWT Middleware (auth guard)
        |-- Route Handlers
        |-- Mongoose ODM
        v
MongoDB Atlas (Cloud Database)
        |
        +-- Cloudinary (Image Storage)
        +-- Nodemailer (Email Service)
```

The application follows a standard three-tier architecture:

- **Presentation Layer**: React SPA served via Vite. Communicates with the backend exclusively through REST API calls. React Query handles caching, background refetching, and loading states.
- **Application Layer**: Express.js REST API handling routing, authentication middleware, business logic, and integration with third-party services.
- **Data Layer**: MongoDB Atlas with Mongoose schemas for structured document modeling. Cloudinary handles binary media storage separately from the database.

---

## Project Structure

```
farmfleet/
├── backend/                       # Node.js + Express REST API
│   ├── config/                    # Database and environment configuration
│   ├── controllers/               # Route handler logic
│   ├── middleware/                # Express middleware (auth, upload, etc.)
│   ├── models/                    # Mongoose schema definitions
│   ├── routes/                    # Express route definitions
│   ├── utils/                     # Helper utilities
│   ├── .env                       # Environment variables
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js                  # Express app entry point
│   └── test.js
│
├── node_modules/                  # Root-level shared dependencies
│
├── public/                        # Static assets served by the frontend
│
└── src/                           # Frontend React application (Vite + TypeScript)
    ├── components/                # Reusable UI components
    ├── hooks/                     # Custom React hooks
    ├── i18n/                      # i18next configuration and translation files
    ├── lib/                       # Utility functions and API clients
    ├── routes/                    # TanStack Router route definitions
    │   ├── router.tsx             # Router instance setup
    │   ├── routeTree.gen.ts       # Auto-generated route tree
    │   ├── server.ts
    │   └── start.ts
    ├── styles.css                 # Global styles
    ├── .gitignore
    ├── .prettierignore
    ├── .prettierrc
    ├── components.json            # ShadCN UI component config
    ├── eslint.config.js
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- MongoDB Atlas account
- Cloudinary account
- SMTP credentials (Gmail or any SMTP provider)

### Clone the Repository

```bash
git clone https://github.com/your-username/farmfleet.git
cd farmfleet
```

### Install Dependencies

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

---

## Environment Variables

### Backend — `server/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/farmfleet

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=FarmFleet <your_email@gmail.com>

# Frontend URL (for email links)
CLIENT_URL=http://localhost:5173
```

### Frontend — `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Running the Application

### Development Mode

```bash
# Start the backend server
cd server
npm run dev

# In a separate terminal, start the frontend
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:5000`.

### Production Build

```bash
# Build the frontend
cd client
npm run build

# Build the backend
cd server
npm run build

# Start the production server
npm start
```

---

## API Overview

All API routes are prefixed with `/api`. Protected routes require a valid JWT Bearer token in the `Authorization` header.

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user (farmer or owner) |
| POST | `/api/auth/login` | Public | Authenticate and receive JWT |
| POST | `/api/auth/verify-otp` | Public | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Public | Resend OTP to registered email |
| GET | `/api/auth/me` | Protected | Get current authenticated user |

### Equipment

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/equipment` | Public | List all available equipment |
| GET | `/api/equipment/:id` | Public | Get equipment detail by ID |
| POST | `/api/equipment` | Owner | Create a new equipment listing |
| PUT | `/api/equipment/:id` | Owner | Update an equipment listing |
| DELETE | `/api/equipment/:id` | Owner | Delete an equipment listing |
| GET | `/api/equipment/owner/listings` | Owner | Get all listings for the authenticated owner |

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/bookings` | Farmer | Create a new booking request |
| GET | `/api/bookings/farmer` | Farmer | Get all bookings for the authenticated farmer |
| GET | `/api/bookings/owner` | Owner | Get all bookings for the authenticated owner's equipment |
| PATCH | `/api/bookings/:id/accept` | Owner | Accept a booking request |
| PATCH | `/api/bookings/:id/reject` | Owner | Reject a booking request |
| PATCH | `/api/bookings/:id/complete` | Owner | Mark a booking as completed |

### Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/reviews` | Farmer | Submit a review for a completed booking |
| GET | `/api/reviews/equipment/:id` | Public | Get reviews for a specific equipment listing |
| GET | `/api/reviews/owner` | Owner | Get all reviews received by the authenticated owner |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Protected | Get the authenticated user's profile |
| PUT | `/api/users/profile` | Protected | Update profile information |
| GET | `/api/users/owner/earnings` | Owner | Get earnings summary and breakdown |

---

## Database Design

### User

```
User {
  _id         : ObjectId
  name        : String
  email       : String (unique)
  password    : String (hashed)
  role        : Enum ["farmer", "owner"]
  phone       : String
  location    : String
  avatar      : String (Cloudinary URL)
  isVerified  : Boolean
  otp         : String
  otpExpiry   : Date
  createdAt   : Date
  updatedAt   : Date
}
```

### Equipment

```
Equipment {
  _id           : ObjectId
  owner         : ObjectId (ref: User)
  name          : String
  category      : String
  description   : String
  pricePerDay   : Number
  location      : String
  images        : [String] (Cloudinary URLs)
  isAvailable   : Boolean
  createdAt     : Date
  updatedAt     : Date
}
```

### Booking

```
Booking {
  _id           : ObjectId
  equipment     : ObjectId (ref: Equipment)
  farmer        : ObjectId (ref: User)
  owner         : ObjectId (ref: User)
  startDate     : Date
  endDate       : Date
  totalDays     : Number
  totalAmount   : Number
  status        : Enum ["pending", "accepted", "rejected", "completed"]
  message       : String
  createdAt     : Date
  updatedAt     : Date
}
```

### Review

```
Review {
  _id         : ObjectId
  booking     : ObjectId (ref: Booking)
  equipment   : ObjectId (ref: Equipment)
  farmer      : ObjectId (ref: User)
  owner       : ObjectId (ref: User)
  rating      : Number (1–5)
  comment     : String
  createdAt   : Date
}
```

---

## Future Improvements

- **Payment Integration**: Razorpay or Stripe integration to support in-platform rental payments and automated owner payouts
- **Geolocation Search**: Map-based equipment discovery using GPS coordinates and proximity filters
- **Real-time Notifications**: WebSocket-based live notifications for booking events and owner responses
- **Admin Dashboard**: A platform administration panel for user moderation, listing oversight, and dispute resolution
- **Equipment Availability Calendar**: Visual calendar view allowing owners to block out dates and farmers to see real-time availability
- **Mobile Application**: React Native app for farmers with limited desktop access
- **Verification Badges**: Owner verification and equipment condition certification workflows
- **Analytics**: Advanced earnings analytics and seasonal demand trends for equipment owners
- **AI-Based Recommendations**: Equipment suggestions based on farmer location, crop type, and booking history

---

## Challenges Solved

**Role-based routing and access control**: Designing a single authentication system that cleanly separates farmer and owner workflows required careful JWT payload design and middleware-level route guarding on both the API and client-side router.

**Booking lifecycle state management**: Modeling the transition states of a booking (pending → accepted/rejected → completed) required careful event handling and corresponding email notification triggers at each state transition.

**Image upload integration**: Coordinating multipart form data through Express middleware, uploading to Cloudinary, and associating returned URLs with database documents required a consistent service-layer abstraction.

**Multilingual support**: Integrating i18next across a large component tree without hardcoded strings required establishing a translation file structure and enforcing consistent key naming conventions from early in development.

**Form validation across complex flows**: Using React Hook Form with Zod schema validation across multi-step registration and listing forms required careful error propagation and field-level feedback design.

---

## Learning Outcomes

- Designing and implementing role-based access control in a full-stack JavaScript application
- Structuring a REST API with clearly separated concerns across controllers, services, and models
- Managing asynchronous server state on the client using React Query patterns (query invalidation, optimistic updates, error boundaries)
- Integrating third-party services (Cloudinary, Nodemailer) behind service abstractions for testability and maintainability
- Building a type-safe frontend with TypeScript, including shared type definitions across forms, API responses, and route params
- Applying internationalization patterns with i18next in a production-scale React application

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes with descriptive messages

```bash
git commit -m "feat: add geolocation-based equipment search"
```

4. Push to your fork and open a Pull Request against the `main` branch

Please ensure your code follows the existing TypeScript and ESLint conventions and that any new API endpoints are documented in the API Overview section.

---

## Author

Developed and maintained as a portfolio project demonstrating full-stack development with React, Node.js, and MongoDB.

For questions, feedback, or collaboration, feel free to open a GitHub issue or reach out via the contact details on the repository profile.
