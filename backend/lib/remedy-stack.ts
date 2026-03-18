import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

// ── Table definitions ──────────────────────────────────────────────
const TABLES: { name: string; pk: string; sk?: string; gsi?: { name: string; pk: string; sk?: string }[] }[] = [
  { name: 'clients', pk: 'id', gsi: [{ name: 'byEmail', pk: 'email' }, { name: 'byInstructor', pk: 'preferredInstructor' }] },
  { name: 'appointments', pk: 'id', gsi: [{ name: 'byDate', pk: 'date', sk: 'time' }, { name: 'byClient', pk: 'patientId', sk: 'date' }, { name: 'byInstructor', pk: 'instructorId', sk: 'date' }] },
  { name: 'services', pk: 'id', gsi: [{ name: 'byCategory', pk: 'category' }] },
  { name: 'instructors', pk: 'id' },
  { name: 'locations', pk: 'id' },
  { name: 'class_packages', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
  { name: 'inventory', pk: 'id', gsi: [{ name: 'bySku', pk: 'sku' }] },
  { name: 'emails', pk: 'id' },
  { name: 'texts', pk: 'id' },
  { name: 'social_posts', pk: 'id' },
  { name: 'retention_alerts', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }, { name: 'byStatus', pk: 'status' }] },
  { name: 'photos', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
  { name: 'trainees', pk: 'id' },
  { name: 'posture_assessments', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
  { name: 'prescriptions', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
  { name: 'bookings', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
  { name: 'settings', pk: 'key' },
  { name: 'checkins', pk: 'id', gsi: [{ name: 'byDate', pk: 'date' }] },
  { name: 'waivers', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
  { name: 'waitlist', pk: 'id', gsi: [{ name: 'byService', pk: 'serviceId' }] },
  { name: 'wallet', pk: 'id', gsi: [{ name: 'byClient', pk: 'clientId' }] },
  { name: 'transactions', pk: 'id', gsi: [{ name: 'byClient', pk: 'clientId', sk: 'date' }] },
  { name: 'inbox', pk: 'id', gsi: [{ name: 'byClient', pk: 'clientId' }] },
  { name: 'reviews', pk: 'id', gsi: [{ name: 'byInstructor', pk: 'instructorId' }] },
  { name: 'referrals', pk: 'id', gsi: [{ name: 'byReferrer', pk: 'referrerId' }] },
  { name: 'referral_settings', pk: 'key' },
  { name: 'memberships', pk: 'id', gsi: [{ name: 'byClient', pk: 'clientId' }, { name: 'byTier', pk: 'tier' }] },
  { name: 'membership_packages', pk: 'id' },
  { name: 'recovery_tips', pk: 'id' },
  { name: 'charts', pk: 'id', gsi: [{ name: 'byClient', pk: 'patientId' }] },
];

// ── Lambda route definitions ───────────────────────────────────────
const ROUTES: [string, string, string, string[]][] = [
  // Clients
  ['GET',    '/api/clients',              'clients',        ['clients']],
  ['GET',    '/api/clients/{id}',         'clients',        ['clients']],
  ['POST',   '/api/clients',              'clients',        ['clients']],
  ['PUT',    '/api/clients/{id}',         'clients',        ['clients']],
  ['DELETE', '/api/clients/{id}',         'clients',        ['clients']],
  // Appointments
  ['GET',    '/api/appointments',         'appointments',   ['appointments']],
  ['GET',    '/api/appointments/{id}',    'appointments',   ['appointments']],
  ['POST',   '/api/appointments',         'appointments',   ['appointments']],
  ['PUT',    '/api/appointments/{id}',    'appointments',   ['appointments']],
  ['DELETE', '/api/appointments/{id}',    'appointments',   ['appointments']],
  // Services
  ['GET',    '/api/services',             'services',       ['services']],
  ['GET',    '/api/services/{id}',        'services',       ['services']],
  ['POST',   '/api/services',             'services',       ['services']],
  ['PUT',    '/api/services/{id}',        'services',       ['services']],
  ['DELETE', '/api/services/{id}',        'services',       ['services']],
  // Instructors
  ['GET',    '/api/instructors',          'instructors',    ['instructors']],
  ['GET',    '/api/instructors/{id}',     'instructors',    ['instructors']],
  ['POST',   '/api/instructors',          'instructors',    ['instructors']],
  ['PUT',    '/api/instructors/{id}',     'instructors',    ['instructors']],
  // Locations
  ['GET',    '/api/locations',            'locations',      ['locations']],
  ['POST',   '/api/locations',            'locations',      ['locations']],
  // Class Packages
  ['GET',    '/api/packages',             'packages',       ['class_packages']],
  ['GET',    '/api/packages/{id}',        'packages',       ['class_packages']],
  ['POST',   '/api/packages',             'packages',       ['class_packages']],
  ['PUT',    '/api/packages/{id}',        'packages',       ['class_packages']],
  ['DELETE', '/api/packages/{id}',        'packages',       ['class_packages']],
  // Inventory
  ['GET',    '/api/inventory',            'inventory',      ['inventory']],
  ['POST',   '/api/inventory',            'inventory',      ['inventory']],
  ['PUT',    '/api/inventory/{id}',       'inventory',      ['inventory']],
  ['POST',   '/api/inventory/adjust',     'inventory',      ['inventory']],
  // Emails
  ['GET',    '/api/emails',               'emails',         ['emails']],
  ['POST',   '/api/emails',               'emails',         ['emails']],
  // Texts
  ['GET',    '/api/texts',                'texts',          ['texts']],
  ['POST',   '/api/texts',                'texts',          ['texts']],
  // Social Posts
  ['GET',    '/api/social-posts',         'social-posts',   ['social_posts']],
  ['POST',   '/api/social-posts',         'social-posts',   ['social_posts']],
  ['PUT',    '/api/social-posts/{id}',    'social-posts',   ['social_posts']],
  ['DELETE', '/api/social-posts/{id}',    'social-posts',   ['social_posts']],
  // Retention Alerts
  ['GET',    '/api/retention',            'retention',      ['retention_alerts']],
  ['PUT',    '/api/retention/{id}',       'retention',      ['retention_alerts']],
  // Photos
  ['GET',    '/api/photos',               'photos',         ['photos']],
  ['POST',   '/api/photos',               'photos',         ['photos']],
  ['DELETE', '/api/photos/{id}',          'photos',         ['photos']],
  // Trainees
  ['GET',    '/api/trainees',             'trainees',       ['trainees']],
  ['POST',   '/api/trainees',             'trainees',       ['trainees']],
  ['PUT',    '/api/trainees/{id}',        'trainees',       ['trainees']],
  ['DELETE', '/api/trainees/{id}',        'trainees',       ['trainees']],
  // Posture Assessments
  ['GET',    '/api/posture',              'posture',        ['posture_assessments']],
  ['POST',   '/api/posture',              'posture',        ['posture_assessments']],
  ['DELETE', '/api/posture/{id}',         'posture',        ['posture_assessments']],
  // Prescriptions
  ['GET',    '/api/prescriptions',        'prescriptions',  ['prescriptions']],
  ['POST',   '/api/prescriptions',        'prescriptions',  ['prescriptions']],
  ['DELETE', '/api/prescriptions/{id}',   'prescriptions',  ['prescriptions']],
  // Bookings (fatigue tracking)
  ['GET',    '/api/bookings',             'bookings',       ['bookings']],
  ['POST',   '/api/bookings',             'bookings',       ['bookings']],
  ['DELETE', '/api/bookings/{id}',        'bookings',       ['bookings']],
  // Settings
  ['GET',    '/api/settings',             'settings',       ['settings']],
  ['PUT',    '/api/settings',             'settings',       ['settings']],
  // Check-ins
  ['GET',    '/api/checkins',             'checkins',       ['checkins']],
  ['POST',   '/api/checkins',             'checkins',       ['checkins']],
  // Waivers
  ['GET',    '/api/waivers',              'waivers',        ['waivers']],
  ['POST',   '/api/waivers',              'waivers',        ['waivers']],
  ['PUT',    '/api/waivers/{id}',         'waivers',        ['waivers']],
  // Waitlist
  ['GET',    '/api/waitlist',             'waitlist',       ['waitlist']],
  ['POST',   '/api/waitlist',             'waitlist',       ['waitlist']],
  ['DELETE', '/api/waitlist/{id}',        'waitlist',       ['waitlist']],
  // Wallet
  ['GET',    '/api/wallet',               'wallet',         ['wallet']],
  ['POST',   '/api/wallet',               'wallet',         ['wallet']],
  ['PUT',    '/api/wallet/{id}',          'wallet',         ['wallet']],
  // Transactions
  ['GET',    '/api/transactions',         'transactions',   ['transactions']],
  ['POST',   '/api/transactions',         'transactions',   ['transactions']],
  // Inbox
  ['GET',    '/api/inbox',                'inbox',          ['inbox']],
  ['POST',   '/api/inbox',                'inbox',          ['inbox']],
  ['PUT',    '/api/inbox/{id}',           'inbox',          ['inbox']],
  // Reviews
  ['GET',    '/api/reviews',              'reviews',        ['reviews']],
  ['POST',   '/api/reviews',              'reviews',        ['reviews']],
  ['PUT',    '/api/reviews/{id}',         'reviews',        ['reviews']],
  // Referrals
  ['GET',    '/api/referrals',            'referrals',      ['referrals', 'referral_settings']],
  ['POST',   '/api/referrals',            'referrals',      ['referrals']],
  ['PUT',    '/api/referrals/{id}',       'referrals',      ['referrals']],
  ['GET',    '/api/referral-settings',    'referrals',      ['referral_settings']],
  ['PUT',    '/api/referral-settings',    'referrals',      ['referral_settings']],
  // Memberships
  ['GET',    '/api/memberships',          'memberships',    ['memberships', 'membership_packages']],
  ['POST',   '/api/memberships',          'memberships',    ['memberships']],
  ['PUT',    '/api/memberships/{id}',     'memberships',    ['memberships']],
  ['DELETE', '/api/memberships/{id}',     'memberships',    ['memberships']],
  ['GET',    '/api/membership-packages',  'memberships',    ['membership_packages']],
  ['POST',   '/api/membership-packages',  'memberships',    ['membership_packages']],
  ['PUT',    '/api/membership-packages/{id}', 'memberships', ['membership_packages']],
  // Recovery Tips
  ['GET',    '/api/recovery-tips',        'recovery-tips',  ['recovery_tips']],
  ['POST',   '/api/recovery-tips',        'recovery-tips',  ['recovery_tips']],
  ['PUT',    '/api/recovery-tips/{id}',   'recovery-tips',  ['recovery_tips']],
  // Charts
  ['GET',    '/api/charts',               'charts',         ['charts']],
  ['POST',   '/api/charts',               'charts',         ['charts']],
  ['PUT',    '/api/charts/{id}',          'charts',         ['charts']],
];

export class RemedyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── S3 bucket for uploads (photos, waivers, etc.) ────────────
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `remedy-uploads-${this.account}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3600,
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ── Cognito User Pool ────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'RemedyUserPool', {
      userPoolName: 'remedy-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = userPool.addClient('RemedyWebClient', {
      userPoolClientName: 'remedy-web',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: ['http://localhost:5173/auth/callback', 'https://remedypilates.com/auth/callback'],
        logoutUrls: ['http://localhost:5173', 'https://remedypilates.com'],
      },
    });

    // Studio roles
    for (const group of ['owner', 'instructor', 'front_desk', 'trainee', 'client']) {
      new cognito.CfnUserPoolGroup(this, `Group-${group}`, {
        userPoolId: userPool.userPoolId,
        groupName: group,
        description: `${group} role`,
      });
    }

    // ── DynamoDB Tables ──────────────────────────────────────────
    const tables: Record<string, dynamodb.Table> = {};

    for (const def of TABLES) {
      const table = new dynamodb.Table(this, `Table-${def.name}`, {
        tableName: `remedy-${def.name}`,
        partitionKey: { name: def.pk, type: dynamodb.AttributeType.STRING },
        ...(def.sk ? { sortKey: { name: def.sk, type: dynamodb.AttributeType.STRING } } : {}),
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      if (def.gsi) {
        for (const gsi of def.gsi) {
          table.addGlobalSecondaryIndex({
            indexName: gsi.name,
            partitionKey: { name: gsi.pk, type: dynamodb.AttributeType.STRING },
            ...(gsi.sk ? { sortKey: { name: gsi.sk, type: dynamodb.AttributeType.STRING } } : {}),
            projectionType: dynamodb.ProjectionType.ALL,
          });
        }
      }

      tables[def.name] = table;
    }

    // ── API Gateway HTTP API ─────────────────────────────────────
    const api = new apigw.HttpApi(this, 'RemedyApi', {
      apiName: 'remedy-api',
      corsPreflight: {
        allowOrigins: ['http://localhost:5173', 'https://remedypilates.com'],
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // ── Lambda Functions ─────────────────────────────────────────
    const lambdaCache: Record<string, lambda.Function> = {};
    const lambdaDir = path.join(__dirname, '..', 'lambda');

    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(lambdaDir, 'shared')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared DynamoDB helpers and response utilities',
    });

    for (const [method, routePath, folder, tableNames] of ROUTES) {
      if (!lambdaCache[folder]) {
        const fn = new lambda.Function(this, `Fn-${folder}`, {
          functionName: `remedy-${folder}`,
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: 'index.handler',
          code: lambda.Code.fromAsset(path.join(lambdaDir, folder)),
          layers: [sharedLayer],
          memorySize: 256,
          timeout: cdk.Duration.seconds(10),
          environment: {
            TABLE_PREFIX: 'remedy-',
            UPLOADS_BUCKET: uploadsBucket.bucketName,
            USER_POOL_ID: userPool.userPoolId,
          },
        });

        uploadsBucket.grantReadWrite(fn);
        lambdaCache[folder] = fn;
      }

      for (const tableName of tableNames) {
        if (tables[tableName]) {
          tables[tableName].grantReadWriteData(lambdaCache[folder]);
        }
      }

      const httpMethod = apigw.HttpMethod[method as keyof typeof apigw.HttpMethod];
      api.addRoutes({
        path: routePath,
        methods: [httpMethod],
        integration: new integrations.HttpLambdaIntegration(
          `${method}-${routePath.replace(/[/{}]/g, '-')}`,
          lambdaCache[folder]
        ),
      });
    }

    // ── Outputs ──────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 uploads bucket',
    });
  }
}
