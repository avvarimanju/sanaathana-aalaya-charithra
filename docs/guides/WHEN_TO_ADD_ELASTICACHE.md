# When to Add ElastiCache Redis

Quick reference guide for deciding when to add ElastiCache to the dashboard infrastructure.

---

## Current Status: ❌ ElastiCache NOT Deployed

The dashboard currently queries DynamoDB directly. This works perfectly fine for initial deployment.

---

## Decision Checklist

Add ElastiCache when you answer **YES** to 2 or more of these questions:

### Performance Indicators
- [ ] Dashboard takes >1 second to load
- [ ] Users complain about slow dashboard performance
- [ ] CloudWatch shows Lambda execution times >800ms for dashboard queries

### Usage Indicators
- [ ] 50+ concurrent admin users accessing dashboard
- [ ] Dashboard refreshed >1000 times per day
- [ ] Multiple regional managers using dashboard simultaneously

### Cost Indicators
- [ ] DynamoDB read costs for dashboard exceed $10/month
- [ ] CloudWatch shows >100K DynamoDB read requests/day for dashboard
- [ ] Cost savings from reduced DynamoDB reads would offset ElastiCache cost

---

## How to Check Current Metrics

### 1. Check Dashboard Performance
```bash
# View Lambda execution times in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=dashboard-query-handler \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### 2. Check DynamoDB Read Costs
```bash
# View DynamoDB costs in Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://dynamodb-filter.json
```

### 3. Check Concurrent Users
- Log into CloudWatch
- Navigate to Lambda → dashboard-query-handler → Monitoring
- Check "Concurrent executions" metric
- If consistently >20, consider adding cache

---

## Migration Steps (When Ready)

### Step 1: Update CDK Stack (5 minutes)

Add to `infrastructure/stacks/DashboardStack.ts`:

```typescript
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

// Add after DynamoDB tables section
const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
  description: 'Subnet group for dashboard cache',
  subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
  cacheSubnetGroupName: `${props.environment}-dashboard-cache-subnet`
});

const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
  vpc,
  description: 'Security group for dashboard cache',
  allowAllOutbound: true
});

cacheSecurityGroup.addIngressRule(
  ec2.Peer.ipv4(vpc.vpcCidrBlock),
  ec2.Port.tcp(6379),
  'Allow Redis access from VPC'
);

const cacheCluster = new elasticache.CfnCacheCluster(this, 'DashboardCache', {
  cacheNodeType: 'cache.t3.micro',
  engine: 'redis',
  numCacheNodes: 1,
  cacheSubnetGroupName: cacheSubnetGroup.ref,
  vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
  clusterName: `${props.environment}-dashboard-cache`
});

new cdk.CfnOutput(this, 'CacheEndpoint', {
  value: cacheCluster.attrRedisEndpointAddress,
  description: 'Redis cache endpoint'
});
```

### Step 2: Update Lambda Environment Variables (2 minutes)

Add to Lambda function environment:
```typescript
environment: {
  // ... existing variables
  CACHE_ENABLED: 'true',
  REDIS_ENDPOINT: cacheCluster.attrRedisEndpointAddress,
  REDIS_PORT: '6379',
  CACHE_TTL_SECONDS: '30'
}
```

### Step 3: Deploy (2 minutes)

```bash
cd infrastructure
cdk deploy DashboardStack
```

### Step 4: Verify (1 minute)

```bash
# Check cache is working
aws elasticache describe-cache-clusters \
  --cache-cluster-id dev-dashboard-cache \
  --show-cache-node-info
```

---

## Cost Impact

| Scenario | Monthly Cost | Performance |
|----------|--------------|-------------|
| **Without Cache (Current)** | $5-16 | 500-800ms load time |
| **With Cache (Future)** | $17-28 | 50-100ms load time |

**Net Cost Increase**: $12/month  
**Performance Improvement**: 5-10x faster

---

## Rollback Plan

If ElastiCache causes issues:

1. Set `CACHE_ENABLED=false` in Lambda environment
2. Redeploy Lambda functions
3. Dashboard continues working (queries DynamoDB directly)
4. Delete ElastiCache cluster to stop charges

---

## Questions?

- Review: `docs/business/COST_OPTIMIZATION_DECISIONS.md`
- Code: `src/dashboard/services/CacheService.ts`
- Design: `.kiro/specs/real-time-reports-dashboard/design.md`
