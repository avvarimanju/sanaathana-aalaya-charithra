/**
 * DynamoDB utility functions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import config from '../config';

// Create DynamoDB client with LocalStack support
const clientConfig: any = { region: config.region };

// If AWS_ENDPOINT_URL is set (for LocalStack), use it
if (process.env.AWS_ENDPOINT_URL) {
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  };
}

const client = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export interface DynamoDBKey {
  PK: string;
  SK: string;
}

export async function putItem(tableName: string, item: any): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
}

export async function getItem<T>(tableName: string, key: DynamoDBKey): Promise<T | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
    })
  );
  return (result.Item as T) || null;
}

export async function queryItems<T>(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: any,
  indexName?: string,
  scanIndexForward: boolean = true
): Promise<T[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      IndexName: indexName,
      ScanIndexForward: scanIndexForward,
    })
  );
  return (result.Items as T[]) || [];
}

export async function updateItem(
  tableName: string,
  key: DynamoDBKey,
  updateExpression: string,
  expressionAttributeValues: any,
  expressionAttributeNames?: any,
  conditionExpression?: string
): Promise<any> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ConditionExpression: conditionExpression,
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

export async function deleteItem(tableName: string, key: DynamoDBKey): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: key,
    })
  );
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}

export function generatePK(prefix: string, id: string): string {
  return `${prefix}#${id}`;
}

export function generateSK(prefix: string, id?: string): string {
  return id ? `${prefix}#${id}` : prefix;
}
