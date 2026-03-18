#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RemedyStack } from '../lib/remedy-stack';

const app = new cdk.App();
new RemedyStack(app, 'RemedyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  description: 'Remedy Pilates & Barre — Studio Management Backend',
});
