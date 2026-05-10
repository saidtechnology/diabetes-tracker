# Diabetes Tracker

> A full-stack Type 2 diabetes tracker app — patients log glucose readings (manual + OCR), doctors link via a 6-character code, with multi-language support (Arabic, French, English) and consecutive danger alerts.

**Owner:** Said Ouarrak — [saidx5@gmail.com](mailto:saidx5@gmail.com)

---

## Features

### For Patients
- **Manual glucose entry** — log blood glucose with meal context (before/after, meal type)
- **Camera OCR entry** — take a photo of your glucose meter, Tesseract.js extracts the reading
- **Dashboard** — view today's readings count and 20-reading glucose trend chart
- **Link to doctor** — enter a 6-character doctor code to share your readings
- **Multi-language** — switch between English, Arabic (RTL), and French
- **Email verification** — verify account via email (free, Resend mock fallback)
- **Phone OTP verification** — 6-digit OTP via SMS (Twilio or Firebase free tier)

### For Doctors
- **Doctor code** — generate a unique 6-character code to give to patients
- **Patient list** — view all linked patients with their latest reading
- **Patient detail** — full glucose history chart for each patient
- **Danger alerts** — email notification when a patient has 3 consecutive readings >250 mg/dL within 24 hours

### Technical Features
- JWT-based authentication via Next-Auth
- PostgreSQL database with Prisma 7 ORM
- Server-side rendering (RSC) for authenticated pages
- Mobile-responsive Tailwind CSS v4 design
- Structured JSON logging
- Docker Compose for local development

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 + React 19 |
| Database | PostgreSQL 18 |
| ORM | Prisma 7.8 |
| Auth | Next-Auth v4.24 (Credentials, JWT) |
| Styling | Tailwind CSS v4 |
| OCR | Tesseract.js v7 |
| Charts | Recharts v3 |
| SMS | Twilio v6 / Firebase Auth (free tier, mock fallback) |
| Email | Resend v6 (free tier, mock fallback) |
| Phone/Email Verify | Email token OR Phone OTP (Twilio/Firebase) — user choice |
| i18n | Custom React Context + Server i18n (ar/fr/en) |
| Bundler | Webpack |

---

## Prerequisites

- **Node.js** >= 20
- **Docker** (for PostgreSQL)
- **Git**

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/saidtechnology/diabetes-tracker.git
cd diabetes-tracker
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if needed — defaults work for local Docker PostgreSQL.

### 4. Push database schema and seed

```bash
npx prisma generate
npm run db:push
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**

### Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@example.com | password123 |
| Patient | patient@example.com | password123 |

Doctor code for patient registration: **ABC123**

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                 # Authenticated pages
│   │   ├── dashboard/         # Patient/Doctor dashboard
│   │   ├── measurements/
│   │   │   ├── manual/        # Manual glucose entry
│   │   │   └── camera/        # OCR camera entry
│   │   ├── patients/          # Doctor's patient management
│   │   └── settings/          # Doctor code / Link doctor
│   ├── (auth)/                # Login/Register/Verify pages
│   ├── api/                   # REST API routes
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Root redirect
├── components/
│   ├── app-shell.tsx          # Navigation shell
│   ├── providers.tsx          # Session + i18n providers
│   ├── language-switcher.tsx  # Language toggle
│   └── patient/
│       └── glucose-chart.tsx  # Glucose trend chart
├── lib/
│   ├── auth.ts                # Next-Auth configuration
│   ├── auth-utils.ts          # bcrypt, OTP, code generation
│   ├── constants.ts           # Thresholds and configuration
│   ├── db.ts                  # Prisma client singleton
│   ├── i18n.tsx               # i18n context (ar/fr/en)
│   ├── logger.ts              # Structured JSON logger
│   ├── notification.ts        # Email service (Resend/mock)
│   ├── sms.ts                 # SMS service (Twilio/mock)
│   └── utils.ts               # Shared utilities
└── middleware.ts              # Route protection
```

---

## API Reference

### POST /api/auth/register
Create account. Sends OTP to phone.

```json
{
  "firstName": "Fatima",
  "lastName": "Benali",
  "address": "456 Avenue, Rabat",
  "email": "patient@example.com",
  "phone": "+212600000002",
  "password": "securepassword",
  "role": "PATIENT"
}
```

### POST /api/auth/verify-phone
Verify phone with OTP code.

```json
{ "phone": "+212600000002", "code": "123456" }
```

### POST /api/measurements
Save a glucose reading (Patient only).

```json
{
  "value": 120,
  "measuredAt": "2026-05-10T08:30:00.000Z",
  "mealContext": "AFTER_MEAL",
  "mealType": "BREAKFAST",
  "source": "MANUAL"
}
```

### GET /api/measurements?date=2026-05-10&patientId=xxx
Get readings. Patients see their own. Doctors can query by patientId (if linked).

### POST /api/doctor/code
Generate new doctor linking code (Doctor only).

### POST /api/ocr/parse
OCR parse a meter photo.

```json
{ "image": "data:image/jpeg;base64,..." }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | postgresql://diabetes:diabetes_pass@localhost:5432/diabetes_tracker | PostgreSQL connection string |
| NEXTAUTH_SECRET | Yes | change-me-in-production | JWT encryption secret |
| NEXTAUTH_URL | Yes | http://localhost:3000 | App URL |
| TWILIO_ACCOUNT_SID | No | - | Twilio SMS (mock if empty) |
| TWILIO_AUTH_TOKEN | No | - | Twilio auth token |
| TWILIO_PHONE_NUMBER | No | - | Twilio sender number |
| RESEND_API_KEY | No | - | Resend email (mock if empty) |
| NEXT_PUBLIC_FIREBASE_* | No | - | Firebase config for phone OTP (optional) |
| FIREBASE_SERVICE_ACCOUNT | No | - | Firebase Admin JSON for token verification |

---

## Firebase Setup (Free Phone OTP)

Firebase provides free phone verification (OTP via SMS) as an alternative to Twilio.

### Step 1: Create a Firebase project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** and follow the setup
3. Once created, click the **Web** icon (`</>`) to register a web app

### Step 2: Enable Phone Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Phone** provider
3. Configure the test phone numbers if needed

### Step 3: Get your Firebase config
1. In **Project Settings** → **General** → **Your apps**, find your web app's config
2. Copy the `firebaseConfig` values to your `.env`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### Step 4: Generate a Service Account key (Admin SDK)
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Copy the entire JSON (minified) to this env var:
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```
   > For security, use a single line (minified JSON with no spaces outside strings).

### How it works
- When Firebase is configured, the verify page shows a **"Send OTP (Firebase)"** button
- Firebase sends the SMS directly (no Twilio needed)
- The user enters the OTP and Firebase confirms it
- Our backend verifies the Firebase ID token and activates the account
- If Firebase is not configured, the app falls back to Twilio/mock

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Webpack) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed database with test accounts |

---

## Glucose Color Reference

| Range (mg/dL) | Color | Hex |
|--------------|-------|-----|
| < 70 | Yellow (Low) | #FFD700 |
| 70 — 140 | Green (Normal) | #90EE90 |
| 140 — 250 | Light Red (High) | #FF6B6B |
| > 250 | Dark Red (Danger) | #8B0000 |

---

## Danger Alert System

When a patient records 3 consecutive readings **>250 mg/dL** within a **24-hour window**, an email alert is sent to their linked doctor.

- The alert is sent only once per detection window (tracked via `notified` flag)
- Email uses Resend when configured, otherwise logs to console (mock mode)

---

## Key Design Decisions

1. **Simplicity First** — Prefer 50 lines over 200. No over-engineering.
2. **Mock Fallbacks** — Twilio and Resend gracefully degrade to mock providers when API keys are unset.
3. **Prisma 7 Adapter** — Uses `@prisma/adapter-pg` with `PrismaPg` for PostgreSQL driver integration.
4. **Webpack over Turbopack** — Webpack used for stability in dev mode.
5. **JWT Sessions** — No database sessions. JWT with role embedded in token.

---

## License

MIT — Said Ouarrak
