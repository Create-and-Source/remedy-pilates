#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PilatesStack } from '../lib/pilates-stack';

const app = new cdk.App();
new PilatesStack(app, 'PilatesStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  description: 'Pilates & Barre — Studio Management Backend',
});
