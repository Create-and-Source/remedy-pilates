# Remedy Pilates — AWS Backend Deployment

## Prerequisites

- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS CDK CLI (`npm i -g aws-cdk`)
- An AWS account with admin permissions

## First-Time Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy env and fill in your AWS account ID
cp .env.example .env
# Edit .env → set CDK_DEFAULT_ACCOUNT to your AWS account ID

# 3. Bootstrap CDK (one-time per account/region)
npx cdk bootstrap

# 4. Deploy the stack
npx cdk deploy

# 5. Note the outputs — you'll need the API URL, Cognito Pool ID, and Client ID
```

## After Deploy

CDK prints stack outputs. Copy them into your frontend `.env`:

```
VITE_API_URL=<ApiUrl output>
VITE_COGNITO_USER_POOL_ID=<UserPoolId output>
VITE_COGNITO_CLIENT_ID=<UserPoolClientId output>
VITE_S3_BUCKET=<UploadsBucket output>
```

## Seed Data

Load initial data (instructors, services, locations, sample clients, etc.):

```bash
# Set the table prefix (must match CDK stack)
export TABLE_PREFIX=remedy-
export AWS_REGION=us-west-2

node lambda/seed/run.js
```

## Switching the Frontend

The API client at `src/api/client.js` is a drop-in replacement for `src/data/store.js`. To switch a page from localStorage to the API:

```js
// Before (localStorage)
import { getPatients, addPatient } from '../data/store';

// After (AWS API)
import { getPatients, addPatient } from '../api/client';
```

All function names are identical — no other code changes needed.

## Useful Commands

```bash
npx cdk synth          # Generate CloudFormation template (dry run)
npx cdk diff           # Show pending changes vs deployed stack
npx cdk deploy         # Deploy or update the stack
npx cdk destroy        # Tear down all resources
npx cdk doctor         # Diagnose CDK issues
```

## Architecture

| Service | Purpose |
|---------|---------|
| DynamoDB (30 tables) | All data storage — PAY_PER_REQUEST billing |
| Lambda (28 functions) | API handlers — Node.js 20, CommonJS |
| API Gateway HTTP API | REST endpoints — 95+ routes |
| Cognito | Auth — 5 groups: owner, instructor, front_desk, trainee, client |
| S3 | File uploads (photos, waivers, documents) |

## Costs

With PAY_PER_REQUEST DynamoDB and Lambda, you pay only for actual usage. A small studio (< 500 clients, < 100 daily appointments) typically costs **< $10/month** for the backend infrastructure.

## Stack Resource Limit

The stack uses ~411 of CloudFormation's 500-resource limit. If you add significantly more tables or functions, consider splitting into nested stacks.
