/**
 * Configuration for Temple Pricing Management System
 */

export const config = {
  // DynamoDB Tables
  tables: {
    temples: process.env.TEMPLES_TABLE || 'Temples',
    templeGroups: process.env.TEMPLE_GROUPS_TABLE || 'TempleGroups',
    associations: process.env.ASSOCIATIONS_TABLE || 'TempleGroupAssociations',
    artifacts: process.env.ARTIFACTS_TABLE || 'Artifacts',
    priceConfigs: process.env.PRICE_CONFIGS_TABLE || 'PriceConfigurations',
    priceHistory: process.env.PRICE_HISTORY_TABLE || 'PriceHistory',
    formulas: process.env.FORMULAS_TABLE || 'PricingFormulas',
    formulaHistory: process.env.FORMULA_HISTORY_TABLE || 'FormulaHistory',
    accessGrants: process.env.ACCESS_GRANTS_TABLE || 'AccessGrants',
    overrides: process.env.OVERRIDES_TABLE || 'PriceOverrides',
    auditLog: process.env.AUDIT_LOG_TABLE || 'AuditLog',
    contentPackages: process.env.CONTENT_PACKAGES_TABLE || 'ContentPackages',
    downloadHistory: process.env.DOWNLOAD_HISTORY_TABLE || 'DownloadHistory',
  },

  // S3 Buckets
  buckets: {
    qrCodes: process.env.QR_CODE_BUCKET || 'temple-qr-codes',
    contentPackages: process.env.CONTENT_BUCKET || 'temple-content-packages',
  },

  // CloudFront
  cloudfront: {
    domain: process.env.CLOUDFRONT_DOMAIN || '',
  },

  // Redis Cache
  redis: {
    endpoint: process.env.REDIS_ENDPOINT || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    ttl: {
      priceCache: 3600, // 1 hour
      accessCache: 300, // 5 minutes
      packageMetadata: 1800, // 30 minutes
    },
  },

  // Pricing
  pricing: {
    currency: 'INR',
    minPrice: 0,
    maxPrice: 99999,
    warningThreshold: 10,
    confirmationThreshold: 5000,
    defaultFormula: {
      category: 'DEFAULT',
      basePrice: 50,
      perQRCodePrice: 15,
      roundingRule: {
        type: 'nearest10' as const,
        direction: 'nearest' as const,
      },
      discountFactor: 0.1, // 10% discount for groups
    },
  },

  // Content Packages
  contentPackages: {
    compressionType: 'brotli' as const,
    downloadUrlExpiration: 24 * 60 * 60, // 24 hours in seconds
    maxPackageSize: 500, // MB
    warningSize: 100, // MB
    versionRetention: 3,
    archiveAfterDays: 90,
    deleteAfterDays: 365,
  },

  // API
  api: {
    rateLimit: 100, // requests per minute
    burstLimit: 200,
    cacheMaxAge: 3600, // 1 hour
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableXRay: process.env.ENABLE_XRAY === 'true',
  },

  // AWS Region - Default to ap-south-1 (Mumbai) for optimal performance in India
  region: process.env.AWS_REGION || 'ap-south-1',
};

export default config;
