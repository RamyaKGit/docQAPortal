import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class DocQaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = {
      PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
      PINECONE_INDEX: process.env.PINECONE_INDEX || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
    };

    const workspaceRoot = path.resolve(__dirname, '../../');
    const backendPath = path.join(workspaceRoot, 'backend');
    const depsLockFilePath = path.join(backendPath, 'package-lock.json');

    // Node.js 22 Lambda for /ingest
    const ingestFunction = new nodejs.NodejsFunction(this, 'IngestFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(backendPath, 'src/handlers/ingest.ts'),
      handler: 'handler',
      depsLockFilePath,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node22',
        format: nodejs.OutputFormat.ESM,
        banner: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
      },
    });

    // Node.js 22 Lambda for /ask
    const askFunction = new nodejs.NodejsFunction(this, 'AskFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(backendPath, 'src/handlers/ask.ts'),
      handler: 'handler',
      depsLockFilePath,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node22',
        format: nodejs.OutputFormat.ESM,
        banner: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
      },
    });

    // API Gateway REST API with CORS
    const api = new apigateway.RestApi(this, 'DocQaApi', {
      restApiName: 'Doctor QA Portal API',
      description: 'API Gateway for Document QA Portal',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const ingestResource = api.root.addResource('ingest');
    ingestResource.addMethod('POST', new apigateway.LambdaIntegration(ingestFunction));

    const askResource = api.root.addResource('ask');
    askResource.addMethod('POST', new apigateway.LambdaIntegration(askFunction));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Base URL for API Gateway',
    });
  }
}
