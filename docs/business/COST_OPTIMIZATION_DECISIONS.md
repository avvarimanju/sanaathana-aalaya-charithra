# Cost Optimization Decisions

This document tracks cost optimization decisions made during development to keep infrastructure costs minimal while maintaining full functionality.

---

## Decision 1: Skip ElastiCache Redis Initially

**Date**: February 2026  
**Feature**: Real-Time Reports Dashboard  
**Decision**: Deploy without ElastiCache Redis cache layer

### Rationale

1. **Cost Savings**: $12/month (t3.micro ElastiCache instance)
2. **Acceptable Performance**: Dashboard loads in 500-800ms without cache (vs 50-100ms with cache)
3. **Low Initial Usage**: Expected <20 concurrent admin users initially
4. **Zero Code Changes Required**: CacheService designed with graceful degradation
5. **Easy Migration Path**: Can add ElastiCache later by setting environment variables

### Implementation Details

- `CacheService` checks `CACHE_ENABLED` environment variable
- When disabled or Redis endpoint not provided, all cache operations are no-ops
- Queries go directly to DynamoDB
- All functionality remains identical (only performance differs)

### When to Add ElastiCache

Add ElastiCache when experiencing:
- Dashboard load times >1 second
- DynamoDB read costs >$10/month for dashboard queries
- 50+ concurrent admin users
- Frequent dashboard refreshes causing high DynamoDB load

### Migration Path

1. Deploy ElastiCache t3.micro cluster via CDK
2. Set environment variables:
   ```bash
   CACHE_ENABLED=true
   REDIS_ENDPOINT=your-endpoint.cache.amazonaws.com
   REDIS_PORT=6379
   ```
3. Deploy updated Lambda functions
4. No code changes required

### Cost Impact

**Without ElastiCache (Current)**:
- Fixed monthly: $5-16/month
- Variable: Scales with usage

**With ElastiCache (Future)**:
- Fixed monthly: $17-28/month
- Variable: Reduced DynamoDB costs (80-90% fewer reads)

### References

- Design Document: `.kiro/specs/real-time-reports-dashboard/design.md`
- CacheService Implementation: `src/dashboard/services/CacheService.ts`
- Infrastructure Stack: `infrastructure/stacks/DashboardStack.ts`

---

## Summary

Current total infrastructure cost: **$5-16/month** (without ElastiCache)

This keeps the project affordable during initial development and validation while maintaining the ability to scale performance when needed.
