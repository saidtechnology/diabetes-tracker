# Diabetes Tracker — Project Map

## Owner
**Said Ouarrak** — saidtechnology@gmail.com

## Tech Stack
- **Framework:** Next.js 16.2.6 (App Router, Webpack)
- **Language:** TypeScript 5, React 19
- **Database:** PostgreSQL 18 via Prisma 7.8 (with @prisma/adapter-pg)
- **Auth:** Next-Auth v4.24.14 (Credentials Provider, JWT)
- **Styling:** Tailwind CSS v4
- **OCR:** Tesseract.js v7
- **Charts:** Recharts v3
- **SMS:** Twilio v6 (mock fallback)
- **Email:** Resend v6 (mock fallback)
- **i18n:** Custom React Context (ar/fr/en)
- **Container:** Docker Compose (PostgreSQL)

## Directory Structure

```
diabetes-tracker/
├── prisma/
│   ├── schema.prisma          # Database schema (5 models, 4 enums)
│   └── seed.ts                # Seed script (patient + doctor accounts)
├── messages/
│   ├── en.json                # English translations
│   ├── ar.json                # Arabic translations
│   └── fr.json                # French translations
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated pages (Dashboard layout)
│   │   │   ├── dashboard/
│   │   │   ├── measurements/
│   │   │   │   ├── manual/    # Manual glucose entry
│   │   │   │   └── camera/   # Camera OCR entry
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx   # Doctor's patient list
│   │   │   │   └── [id]/     # Patient detail view
│   │   │   ├── settings/
│   │   │   └── layout.tsx    # AppShell wrapper
│   │   ├── (auth)/           # Unauthenticated pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/  # Next-Auth handler
│   │   │   │   ├── register/
│   │   │   │   ├── send-otp/
│   │   │   │   └── verify-phone/
│   │   │   ├── doctor/code/  # Doctor code generation
│   │   │   ├── measurements/ # Glucose CRUD
│   │   │   └── ocr/parse/   # OCR image processing
│   │   ├── layout.tsx        # Root layout (Providers)
│   │   ├── page.tsx          # Root redirect
│   │   └── globals.css       # Tailwind CSS
│   ├── components/
│   │   ├── app-shell.tsx     # Navigation + layout shell
│   │   ├── providers.tsx     # Session + i18n providers
│   │   ├── language-switcher.tsx
│   │   └── patient/
│   │       └── glucose-chart.tsx  # Recharts line chart
│   ├── generated/prisma/     # Prisma generated client
│   ├── lib/
│   │   ├── auth.ts           # Next-Auth config
│   │   ├── auth-utils.ts     # bcrypt, OTP, code generation
│   │   ├── constants.ts      # Thresholds, configs
│   │   ├── db.ts             # PrismaClient singleton
│   │   ├── i18n.tsx          # Internationalization context
│   │   ├── logger.ts         # Structured JSON logger
│   │   ├── notification.ts   # Email (Resend/mock)
│   │   ├── sms.ts            # SMS (Twilio/mock)
│   │   └── utils.ts          # Shared utilities
│   └── middleware.ts         # Route protection middleware
├── prisma.config.ts          # Prisma 7 datasource config
├── next.config.js            # Next.js config
├── tsconfig.json
├── package.json
├── docker-compose.yml        # PostgreSQL + Redis
├── .env.example
├── .gitignore
├── PROJECT_MAP.md
└── README.md
```

## Database Schema (5 Models)

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | Primary key |
| firstName | String | |
| lastName | String | |
| address | String | |
| email | String (unique) | Login credential |
| phone | String (unique) | OTP verification |
| passwordHash | String | bcrypt |
| role | Role enum | PATIENT or DOCTOR |
| phoneVerified | Boolean | Default false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### DoctorCode
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| doctorId | String | FK → User |
| code | String (unique) | 6-char alphanumeric |
| isUsed | Boolean | One-time use |
| usedByPatientId | String? | FK → User |
| createdAt | DateTime | |

### PatientDoctorLink
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| patientId | String | FK → User |
| doctorId | String | FK → User |
| notified | Boolean | Danger alert tracking |
| linkedAt | DateTime | |

### GlucoseReading
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| patientId | String | FK → User |
| value | Float | mg/dL |
| measuredAt | DateTime | When reading was taken |
| mealContext | MealContext | BEFORE_MEAL or AFTER_MEAL |
| mealType | MealType | BREAKFAST/LUNCH/DINNER/SNACK |
| source | Source | MANUAL or OCR |
| imageUrl | String? | OCR photo reference |
| recordedAt | DateTime | When entered |

### VerificationCode
| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | |
| phone | String | Target phone |
| code | String | 6-digit OTP |
| expiresAt | DateTime | 10 min expiry |
| verified | Boolean | |
| createdAt | DateTime | |
| userId | String? | FK → User |

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| /api/auth/[...nextauth] | * | No | Next-Auth handler |
| /api/auth/register | POST | No | Create account → sends OTP |
| /api/auth/send-otp | POST | No | Resend verification OTP |
| /api/auth/verify-phone | POST | No | Verify phone with OTP |
| /api/doctor/code | POST | Doctor | Generate new doctor code |
| /api/measurements | GET | Yes | Get readings (patient=own, doctor=by patientId) |
| /api/measurements | POST | Patient | Save glucose reading |
| /api/ocr/parse | POST | Patient | OCR parse meter photo |

## Auth Flow
1. Register → OTP sent via SMS → Verify phone → Set phoneVerified=true
2. Login only if phoneVerified=true
3. Next-Auth JWT strategy with custom role in token
4. Middleware protects /dashboard, /measurements, /settings, /patients

## Danger Alert System
- 3 consecutive readings >250 mg/dL within 24h window
- Triggers email to linked doctor via Resend (or mock)
- Doctor notified only once (notified flag on PatientDoctorLink)

## Seed Accounts
- **Doctor:** doctor@example.com / password123
- **Patient:** patient@example.com / password123
- **Doctor Code:** ABC123
- Run: `npm run db:seed`

## Environment Variables
See `.env.example` — all services have mock fallbacks when API keys are empty.
