# Pilates Studio — IT Infrastructure & Credentials

> **Last updated**: 2026-03-18
> **Project**: Pilates & Barre — Studio Management Platform
> **Repo**: https://github.com/Create-and-Source/pilates
> **Status**: Demo-ready (hybrid localStorage + AWS API)

---

## 1. AWS Account

| Field | Value |
|-------|-------|
| **AWS Account ID** | `092016234733` |
| **Account Name** | Pilates Studio |
| **Organization** | Under management account `010822068371` |
| **Region** | `us-west-2` (Oregon) |
| **CLI Profile** | `pilates` (assumes `OrganizationAccountAccessRole` from management account) |
| **IaC** | Terraform (in `terraform/` directory) |

---

## 2. API Gateway

| Field | Value |
|-------|-------|
| **Type** | HTTP API (API Gateway v2) |
| **Endpoint** | `https://zctgtqjm54.execute-api.us-west-2.amazonaws.com` |
| **Stage** | `$default` (auto-deploy) |
| **CORS Origins** | Configured in `terraform/variables.tf` |
| **Allowed Methods** | GET, POST, PUT, DELETE, OPTIONS |
| **Allowed Headers** | Content-Type, Authorization |
| **Total Routes** | 95+ |

### API Routes

| Section | Endpoints |
|---------|-----------|
| **Clients** | `GET/POST /api/clients`, `GET/PUT/DELETE /api/clients/{id}` |
| **Appointments** | `GET/POST /api/appointments`, `GET/PUT/DELETE /api/appointments/{id}` |
| **Services** | `GET/POST /api/services`, `GET/PUT/DELETE /api/services/{id}` |
| **Instructors** | `GET/POST /api/instructors`, `GET/PUT /api/instructors/{id}` |
| **Locations** | `GET/POST /api/locations` |
| **Packages** | `GET/POST /api/packages`, `GET/PUT/DELETE /api/packages/{id}` |
| **Inventory** | `GET/POST /api/inventory`, `PUT /api/inventory/{id}`, `POST /api/inventory/adjust` |
| **Emails** | `GET/POST /api/emails` |
| **Texts** | `GET/POST /api/texts` |
| **Social Posts** | `GET/POST /api/social-posts`, `PUT/DELETE /api/social-posts/{id}` |
| **Retention** | `GET /api/retention`, `PUT /api/retention/{id}` |
| **Photos** | `GET/POST /api/photos`, `DELETE /api/photos/{id}` |
| **Trainees** | `GET/POST /api/trainees`, `PUT/DELETE /api/trainees/{id}` |
| **Posture** | `GET/POST /api/posture`, `DELETE /api/posture/{id}` |
| **Prescriptions** | `GET/POST /api/prescriptions`, `DELETE /api/prescriptions/{id}` |
| **Bookings** | `GET/POST /api/bookings`, `DELETE /api/bookings/{id}` |
| **Settings** | `GET/PUT /api/settings` |
| **Check-ins** | `GET/POST /api/checkins` |
| **Waivers** | `GET/POST /api/waivers`, `PUT /api/waivers/{id}` |
| **Waitlist** | `GET/POST /api/waitlist`, `DELETE /api/waitlist/{id}` |
| **Wallet** | `GET/POST /api/wallet`, `PUT /api/wallet/{id}` |
| **Transactions** | `GET/POST /api/transactions` |
| **Inbox** | `GET/POST /api/inbox`, `PUT /api/inbox/{id}` |
| **Reviews** | `GET/POST /api/reviews`, `PUT /api/reviews/{id}` |
| **Referrals** | `GET/POST /api/referrals`, `PUT /api/referrals/{id}`, `GET/PUT /api/referral-settings` |
| **Memberships** | `GET/POST /api/memberships`, `PUT/DELETE /api/memberships/{id}`, `GET/POST /api/membership-packages`, `PUT /api/membership-packages/{id}` |
| **Recovery Tips** | `GET/POST /api/recovery-tips`, `PUT /api/recovery-tips/{id}` |
| **Charts** | `GET/POST /api/charts`, `PUT /api/charts/{id}` |

---

## 3. Cognito (Authentication)

| Field | Value |
|-------|-------|
| **User Pool ID** | `us-west-2_Y0gGN3ZqQ` |
| **Client ID** | `2mur2u917rd7tvcgg267hrlof7` |
| **Client Type** | Web (public, no secret) |
| **Password Policy** | Min 8 chars, requires uppercase, lowercase, numbers |
| **Auto-verified** | Email |
| **Role Groups** | `owner`, `instructor`, `front_desk`, `trainee`, `client` |

### Demo Roles (SignIn.jsx)

| Role | User | Navigates To |
|------|------|-------------|
| Owner | Kelly Snailum | `/admin` |
| Instructor | Megan Torres | `/admin` |
| Front Desk | Front Desk | `/admin` |
| Client Portal | Client | `/portal` |

---

## 4. S3 (File Storage)

| Field | Value |
|-------|-------|
| **Bucket Name** | `pilates-uploads-092016234733` |
| **Region** | `us-west-2` |
| **Public Access** | Blocked (all four block settings enabled) |
| **CORS** | Allows PUT from configured origins |
| **Purpose** | Client photos, documents, uploaded media |

---

## 5. DynamoDB (Database)

**Billing**: PAY_PER_REQUEST (on-demand) for all tables
**Table prefix**: `pilates-`
**Total tables**: 30

| Table Name | Partition Key | GSIs |
|------------|--------------|------|
| `pilates-clients` | `id` | `email-index` (pk: email) |
| `pilates-appointments` | `id` | `client-index` (pk: clientId, sk: date), `date-index` (pk: date) |
| `pilates-services` | `id` | `category-index` (pk: category) |
| `pilates-instructors` | `id` | `email-index` (pk: email) |
| `pilates-locations` | `id` | — |
| `pilates-packages` | `id` | `type-index` (pk: type) |
| `pilates-inventory` | `id` | `category-index` (pk: category) |
| `pilates-orders` | `id` | `client-index` (pk: clientId), `date-index` (pk: date) |
| `pilates-emails` | `id` | `date-index` (pk: sentDate) |
| `pilates-texts` | `id` | `client-index` (pk: clientId) |
| `pilates-social-posts` | `id` | `status-index` (pk: status) |
| `pilates-retention` | `id` | `client-index` (pk: clientId) |
| `pilates-photos` | `id` | `client-index` (pk: clientId) |
| `pilates-trainees` | `id` | `email-index` (pk: email) |
| `pilates-posture` | `id` | `client-index` (pk: clientId) |
| `pilates-prescriptions` | `id` | `client-index` (pk: clientId) |
| `pilates-bookings` | `id` | `client-index` (pk: clientId), `date-index` (pk: date) |
| `pilates-settings` | `key` | — |
| `pilates-checkins` | `id` | `client-index` (pk: clientId), `date-index` (pk: date) |
| `pilates-waivers` | `id` | `client-index` (pk: clientId) |
| `pilates-waitlist` | `id` | `class-index` (pk: classId) |
| `pilates-wallet` | `id` | `client-index` (pk: clientId) |
| `pilates-transactions` | `id` | `client-index` (pk: clientId), `date-index` (pk: date) |
| `pilates-inbox` | `id` | `client-index` (pk: clientId) |
| `pilates-reviews` | `id` | `client-index` (pk: clientId) |
| `pilates-referrals` | `id` | `referrer-index` (pk: referrerId) |
| `pilates-referral-settings` | `key` | — |
| `pilates-memberships` | `id` | `client-index` (pk: clientId), `status-index` (pk: status) |
| `pilates-membership-packages` | `id` | `type-index` (pk: type) |
| `pilates-recovery-tips` | `id` | `category-index` (pk: category) |
| `pilates-charts` | `id` | `client-index` (pk: clientId) |

---

## 6. Lambda Functions

**Runtime**: Node.js 20.x
**Architecture**: arm64
**Memory**: 256 MB
**Timeout**: 30 seconds
**Shared Layer**: `backend/lambda/shared` (common utilities)
**IAM Role**: Single shared role with DynamoDB + S3 access

### Handlers (28 functions)

| Function | Source | Tables Accessed |
|----------|--------|-----------------|
| `pilates-clients` | `backend/lambda/clients/` | clients |
| `pilates-appointments` | `backend/lambda/appointments/` | appointments |
| `pilates-services` | `backend/lambda/services/` | services |
| `pilates-instructors` | `backend/lambda/instructors/` | instructors |
| `pilates-locations` | `backend/lambda/locations/` | locations |
| `pilates-packages` | `backend/lambda/packages/` | packages |
| `pilates-inventory` | `backend/lambda/inventory/` | inventory |
| `pilates-orders` | `backend/lambda/orders/` | orders |
| `pilates-emails` | `backend/lambda/emails/` | emails |
| `pilates-texts` | `backend/lambda/texts/` | texts |
| `pilates-social-posts` | `backend/lambda/social-posts/` | social-posts |
| `pilates-retention` | `backend/lambda/retention/` | retention |
| `pilates-photos` | `backend/lambda/photos/` | photos |
| `pilates-trainees` | `backend/lambda/trainees/` | trainees |
| `pilates-posture` | `backend/lambda/posture/` | posture |
| `pilates-prescriptions` | `backend/lambda/prescriptions/` | prescriptions |
| `pilates-bookings` | `backend/lambda/bookings/` | bookings |
| `pilates-settings` | `backend/lambda/settings/` | settings |
| `pilates-checkins` | `backend/lambda/checkins/` | checkins |
| `pilates-waivers` | `backend/lambda/waivers/` | waivers |
| `pilates-waitlist` | `backend/lambda/waitlist/` | waitlist |
| `pilates-wallet` | `backend/lambda/wallet/` | wallet |
| `pilates-transactions` | `backend/lambda/transactions/` | transactions |
| `pilates-inbox` | `backend/lambda/inbox/` | inbox |
| `pilates-reviews` | `backend/lambda/reviews/` | reviews |
| `pilates-referrals` | `backend/lambda/referrals/` | referrals, referral-settings |
| `pilates-memberships` | `backend/lambda/memberships/` | memberships, membership-packages |
| `pilates-recovery-tips` | `backend/lambda/recovery-tips/` | recovery-tips |
| `pilates-charts` | `backend/lambda/charts/` | charts |

---

## 7. Frontend

| Field | Value |
|-------|-------|
| **Framework** | React 18 + React Router DOM + Vite |
| **Hosting** | Vercel (SPA with rewrites) |
| **Build Command** | `npm run build` |
| **Output Dir** | `dist/` |
| **Dev Server** | `npm run dev` (port 5173 or next available) |

---

## 8. Native App (Capacitor)

| Field | Value |
|-------|-------|
| **Bundle ID** | `com.pilatesstudio.app` |
| **App Name** | Pilates Studio |
| **Web Dir** | `dist` |
| **iOS Scheme** | `https` |
| **Android Scheme** | `https` |
| **Apple Developer** | Tovah Marx (D9J3CAR62J) |
| **Capacitor Version** | 8.2.0 |

### Build Commands

```bash
npm run build              # Build web assets
npx cap sync ios           # Copy to iOS project
npx cap open ios           # Open Xcode
# In Xcode: Product → Archive → Distribute → TestFlight

npx cap sync android       # Copy to Android project
npx cap open android       # Open Android Studio
```

---

## 9. Environment Variables (.env)

```bash
VITE_API_URL=https://zctgtqjm54.execute-api.us-west-2.amazonaws.com
VITE_COGNITO_USER_POOL_ID=us-west-2_Y0gGN3ZqQ
VITE_COGNITO_CLIENT_ID=2mur2u917rd7tvcgg267hrlof7
VITE_S3_BUCKET=pilates-uploads-092016234733
```

---

## 10. Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│          Vercel / Capacitor Native Shell         │
├─────────────────────────────────────────────────┤
│  store.js — Hybrid Pattern                      │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ localStorage  │  │  API (fire-and-forget)  │  │
│  │ (sync reads)  │  │  (async writes)         │  │
│  └──────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────┤
│              initStore() on app load             │
│   API mode: fetch 13 endpoints → localStorage   │
│   Local mode: seed from defaults if empty        │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────┐
│          API Gateway (HTTP API)                  │
│   https://zctgtqjm54.execute-api.us-west-2...   │
│              95+ routes                          │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│           Lambda Functions (28)                  │
│           Node.js 20 / arm64 / 256MB             │
│           Shared layer for utilities             │
└──────────┬──────────────────────┬───────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│   DynamoDB (30)  │   │   S3 Uploads     │
│   PAY_PER_REQUEST│   │   pilates-uploads  │
│   pilates-* prefix│   │   -092016234733   │
└──────────────────┘   └──────────────────┘
           │
           ▼
┌──────────────────┐
│  Cognito         │
│  User Pool       │
│  5 role groups   │
└──────────────────┘
```

---

## 11. Terraform Commands

```bash
cd terraform/

# Initialize (downloads AWS provider)
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Use the pilates AWS profile
export AWS_PROFILE=pilates
```

### Terraform Files

| File | Purpose |
|------|---------|
| `main.tf` | Provider, data sources, locals (table definitions, handler mappings) |
| `dynamodb.tf` | 30 DynamoDB tables with dynamic GSIs |
| `lambda.tf` | 28 Lambda functions, shared layer, IAM role |
| `api_gateway.tf` | HTTP API, 95+ routes, integrations, permissions |
| `cognito.tf` | User pool, web client, 5 role groups |
| `s3.tf` | Uploads bucket with CORS and access block |
| `variables.tf` | Region, table prefix, project name, CORS origins |
| `outputs.tf` | API URL, pool IDs, bucket name, account ID |

---

## 12. AWS CLI Profile (~/.aws/config)

```ini
[profile pilates]
role_arn = arn:aws:iam::092016234733:role/OrganizationAccountAccessRole
source_profile = default
region = us-west-2
```

---

## 13. Quick Reference

| What | Where |
|------|-------|
| **API** | `https://zctgtqjm54.execute-api.us-west-2.amazonaws.com` |
| **Cognito Pool** | `us-west-2_Y0gGN3ZqQ` |
| **Cognito Client** | `2mur2u917rd7tvcgg267hrlof7` |
| **S3 Bucket** | `pilates-uploads-092016234733` |
| **AWS Account** | `092016234733` |
| **AWS Region** | `us-west-2` |
| **GitHub Repo** | `Create-and-Source/pilates` |
| **Bundle ID** | `com.pilatesstudio.app` |
| **Apple Developer** | Tovah Marx |
