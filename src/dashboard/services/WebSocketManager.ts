/**
 * WebSocketManager - Manages WebSocket connections and real-time updates
 * Feature: real-time-reports-dashboard
 * 
 * Handles WebSocket connection lifecycle, stores connections in DynamoDB,
 * and pushes real-time updates to connected dashboard clients.
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand,
  QueryCommand,
  QueryCommandInput,
  GetItemCommand,
  GetItemCommandOutput,
  QueryCommandOutput,
  ScanCommand,
  ScanCommandOutput
} from '@aws-sdk/client-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException
} from '@aws-sdk/client-apigatewaymanagementapi';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  WebSocketConnection,
  DashboardUpdate,
  FilterState,
  UserRole
} from '../types';
import { GSI_NAMES } from '../constants';

export interface WebSocketManagerConfig {
  connectionsTableName: string;
  apiGatewayEndpoint: string;
  connectionTtlHours?: number;
}

export class WebSocketManager {
  private dynamoClient: DynamoDBClient;
  private apiGatewayClient: ApiGatewayManagementApiClient;
  private connectionsTableName: string;
  private connectionTtlHours: number;

  constructor(
    dynamoClient: DynamoDBClient,
    apiGatewayClient: ApiGatewayManagementApiClient,
    connectionsTableName: string,
    connectionTtlHours: number = 24
  ) {
    this.dynamoClient = dynamoClient;
    this.apiGatewayClient = apiGatewayClient;
    this.connectionsTableName = connectionsTableName;
    this.connectionTtlHours = connectionTtlHours;
  }

  /**
   * Handle new WebSocket connection establishment
   * Stores connection metadata in DynamoDB
   * 
   * Validates: Requirements 9.1, 9.2
   */
  async handleConnect(
    connectionId: string,
    userId: string,
    userRole: UserRole,
    region?: string,
    subscribedFilters?: FilterState
  ): Promise<void> {
    const now = Date.now();
    const ttl = Math.floor(now / 1000) + (this.connectionTtlHours * 60 * 60);

    const connection: WebSocketConnection = {
      connectionId,
      userId,
      userRole,
      region,
      subscribedFilters: subscribedFilters || {
        timeRange: 'all_time',
        templeIds: [],
        regions: region ? [region] : [],
        categories: []
      },
      connectedAt: now,
      lastPingAt: now,
      ttl
    };

    try {
      await this.dynamoClient.send(
        new PutItemCommand({
          TableName: this.connectionsTableName,
          Item: marshall(connection, { removeUndefinedValues: true })
        })
      );
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to store connection');
    }
  }

  /**
   * Handle WebSocket disconnection and cleanup
   * Removes connection from DynamoDB
   * 
   * Validates: Requirements 9.2
   */
  async handleDisconnect(connectionId: string): Promise<void> {
    try {
      await this.dynamoClient.send(
        new DeleteItemCommand({
          TableName: this.connectionsTableName,
          Key: marshall({ connectionId })
        })
      );
    } catch (error) {
      // Log error but don't throw - disconnection cleanup should be best-effort
      console.error(`Failed to delete connection ${connectionId}:`, error);
    }
  }

  /**
   * Push update to specific connection or all connections
   * Sends dashboard updates to connected clients via WebSocket
   * 
   * Validates: Requirements 9.1, 9.4
   */
  async pushUpdate(
    connectionIdOrUpdate: string | DashboardUpdate,
    updateData?: DashboardUpdate
  ): Promise<void> {
    // Handle both signatures: pushUpdate(connectionId, update) and pushUpdate(update, connectionIds)
    if (typeof connectionIdOrUpdate === 'string') {
      // Single connection: pushUpdate(connectionId, update)
      const connectionId = connectionIdOrUpdate;
      const update = updateData!;
      await this.sendToConnection(connectionId, update);
    } else {
      // Multiple connections: pushUpdate(update, connectionIds)
      const update = connectionIdOrUpdate;
      const targetConnectionIds = updateData as any as string[] | undefined;
      
      let connections: WebSocketConnection[];

      if (targetConnectionIds && targetConnectionIds.length > 0) {
        // Get specific connections
        connections = await this.getConnectionsByIds(targetConnectionIds);
      } else {
        // Get all active connections
        connections = await this.getAllConnections();
      }

      // Send update to each connection
      const sendPromises = connections.map(connection =>
        this.sendToConnection(connection.connectionId, update)
      );

      // Wait for all sends to complete (failures are handled individually)
      await Promise.allSettled(sendPromises);
    }
  }

  /**
   * Broadcast update to all connections with a specific role
   * Useful for role-based notifications
   * 
   * Validates: Requirements 9.1, 9.4
   */
  async broadcastToRole(
    update: DashboardUpdate,
    role: UserRole
  ): Promise<void> {
    const connections = await this.getConnectionsByRole(role);

    const sendPromises = connections.map(connection =>
      this.sendToConnection(connection.connectionId, update)
    );

    await Promise.allSettled(sendPromises);
  }

  /**
   * Broadcast update to connections matching specific filters
   * Allows targeted updates based on subscribed filters
   * 
   * Validates: Requirements 9.1, 9.4
   */
  async broadcastToFilters(
    update: DashboardUpdate,
    filters: Partial<FilterState>
  ): Promise<void> {
    const allConnections = await this.getAllConnections();

    // Filter connections based on their subscribed filters
    const matchingConnections = allConnections.filter(connection =>
      this.matchesFilters(connection.subscribedFilters, filters)
    );

    const sendPromises = matchingConnections.map(connection =>
      this.sendToConnection(connection.connectionId, update)
    );

    await Promise.allSettled(sendPromises);
  }

  /**
   * Update connection's last ping timestamp
   * Used for connection health monitoring
   * 
   * Validates: Requirements 9.3
   */
  async updateLastPing(connectionId: string): Promise<void> {
    const now = Date.now();

    try {
      await this.dynamoClient.send(
        new PutItemCommand({
          TableName: this.connectionsTableName,
          Item: marshall({
            connectionId,
            lastPingAt: now
          }),
          ConditionExpression: 'attribute_exists(connectionId)'
        })
      );
    } catch (error) {
      // Connection might have been removed, ignore error
      console.warn(`Failed to update ping for connection ${connectionId}`);
    }
  }

  /**
   * Get connection by ID
   */
  async getConnection(connectionId: string): Promise<WebSocketConnection | null> {
    try {
      const result: GetItemCommandOutput = await this.dynamoClient.send(
        new GetItemCommand({
          TableName: this.connectionsTableName,
          Key: marshall({ connectionId })
        })
      );

      if (!result.Item) {
        return null;
      }

      return unmarshall(result.Item) as WebSocketConnection;
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to get connection');
    }
  }

  /**
   * Get connections by IDs
   */
  private async getConnectionsByIds(
    connectionIds: string[]
  ): Promise<WebSocketConnection[]> {
    const connections: WebSocketConnection[] = [];

    // Fetch connections in parallel
    const promises = connectionIds.map(id => this.getConnection(id));
    const results = await Promise.allSettled(promises);

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        connections.push(result.value);
      }
    });

    return connections;
  }

  /**
   * Get all active connections
   */
  private async getAllConnections(): Promise<WebSocketConnection[]> {
    const connections: WebSocketConnection[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    try {
      do {
        const result: ScanCommandOutput = await this.dynamoClient.send(
          new ScanCommand({
            TableName: this.connectionsTableName,
            ExclusiveStartKey: lastEvaluatedKey
              ? marshall(lastEvaluatedKey)
              : undefined
          })
        );

        if (result.Items) {
          const items = result.Items.map((item: Record<string, any>) =>
            unmarshall(item) as WebSocketConnection
          );
          connections.push(...items);
        }

        lastEvaluatedKey = result.LastEvaluatedKey
          ? unmarshall(result.LastEvaluatedKey)
          : undefined;
      } while (lastEvaluatedKey);

      return connections;
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to get all connections');
    }
  }

  /**
   * Get connections by user role using GSI
   */
  private async getConnectionsByRole(role: UserRole): Promise<WebSocketConnection[]> {
    const connections: WebSocketConnection[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    try {
      do {
        const params: QueryCommandInput = {
          TableName: this.connectionsTableName,
          IndexName: GSI_NAMES.USER_ROLE,
          KeyConditionExpression: 'userRole = :role',
          ExpressionAttributeValues: marshall({
            ':role': role
          }),
          ExclusiveStartKey: lastEvaluatedKey
            ? marshall(lastEvaluatedKey)
            : undefined
        };

        const result: QueryCommandOutput = await this.dynamoClient.send(new QueryCommand(params));

        if (result.Items) {
          const items = result.Items.map((item: Record<string, any>) =>
            unmarshall(item) as WebSocketConnection
          );
          connections.push(...items);
        }

        lastEvaluatedKey = result.LastEvaluatedKey
          ? unmarshall(result.LastEvaluatedKey)
          : undefined;
      } while (lastEvaluatedKey);

      return connections;
    } catch (error) {
      throw this.handleDynamoDBError(error, 'Failed to get connections by role');
    }
  }

  /**
   * Send message to a specific connection
   * Handles stale connections by removing them
   */
  private async sendToConnection(
    connectionId: string,
    data: DashboardUpdate
  ): Promise<void> {
    try {
      const message = JSON.stringify(data);

      await this.apiGatewayClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(message)
        })
      );
    } catch (error) {
      // Handle stale connections
      if (error instanceof GoneException) {
        console.log(`Connection ${connectionId} is stale, removing from database`);
        await this.handleDisconnect(connectionId);
      } else {
        console.error(`Failed to send to connection ${connectionId}:`, error);
      }
    }
  }

  /**
   * Check if connection's subscribed filters match the given filters
   */
  private matchesFilters(
    subscribedFilters: FilterState,
    targetFilters: Partial<FilterState>
  ): boolean {
    // If no target filters specified, match all
    if (!targetFilters || Object.keys(targetFilters).length === 0) {
      return true;
    }

    // Check temple IDs
    if (targetFilters.templeIds && targetFilters.templeIds.length > 0) {
      const hasMatchingTemple = targetFilters.templeIds.some(templeId =>
        subscribedFilters.templeIds.length === 0 ||
        subscribedFilters.templeIds.includes(templeId)
      );
      if (!hasMatchingTemple) {
        return false;
      }
    }

    // Check regions
    if (targetFilters.regions && targetFilters.regions.length > 0) {
      const hasMatchingRegion = targetFilters.regions.some(region =>
        subscribedFilters.regions.length === 0 ||
        subscribedFilters.regions.includes(region)
      );
      if (!hasMatchingRegion) {
        return false;
      }
    }

    // Check categories
    if (targetFilters.categories && targetFilters.categories.length > 0) {
      const hasMatchingCategory = targetFilters.categories.some(category =>
        subscribedFilters.categories.length === 0 ||
        subscribedFilters.categories.includes(category)
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handle DynamoDB errors with proper error messages
   */
  private handleDynamoDBError(error: any, context: string): Error {
    if (error.name === 'ProvisionedThroughputExceededException') {
      return new Error(`${context}: Database throttling detected`);
    }

    if (error.name === 'ResourceNotFoundException') {
      return new Error(`${context}: Table ${this.connectionsTableName} not found`);
    }

    if (error.name === 'ValidationException') {
      return new Error(`${context}: Invalid parameters - ${error.message}`);
    }

    if (error.name === 'AccessDeniedException') {
      return new Error(`${context}: Access denied to DynamoDB table`);
    }

    return new Error(`${context}: ${error.message || 'Unknown error'}`);
  }


    /**
     * Update subscription filters for a connection
     * Requirement 7.5: Support filter persistence across sessions
     *
     * @param connectionId WebSocket connection ID
     * @param filters New filter state
     */
    async updateSubscription(connectionId: string, filters: FilterState): Promise<void> {
      try {
        // Get existing connection
        const getResult: GetItemCommandOutput = await this.dynamoClient.send(
          new GetItemCommand({
            TableName: this.connectionsTableName,
            Key: marshall({ connectionId })
          })
        );

        if (!getResult.Item) {
          throw new Error(`Connection not found: ${connectionId}`);
        }

        const connection = unmarshall(getResult.Item) as WebSocketConnection;

        // Update with new filters
        const updatedConnection: WebSocketConnection = {
          ...connection,
          subscribedFilters: filters,
          lastPingAt: Date.now()
        };

        await this.dynamoClient.send(
          new PutItemCommand({
            TableName: this.connectionsTableName,
            Item: marshall(updatedConnection)
          })
        );

        console.log('Subscription updated', { connectionId, filters });
      } catch (error) {
        console.error('Failed to update subscription', { connectionId, error });
        throw error;
      }
    }

}
