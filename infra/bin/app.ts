#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DocQaStack } from '../lib/doc-qa-stack';
import dotenv from 'dotenv';
import * as path from 'path';

// Optionally load environment variables from backend/.env if available
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const app = new cdk.App();
new DocQaStack(app, 'DocQaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
