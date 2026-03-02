// Jest setup file for Temple Pricing Management tests

// Set test environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.TEMPLES_TABLE = 'Temples';
process.env.TEMPLE_GROUPS_TABLE = 'TempleGroups';
process.env.ASSOCIATIONS_TABLE = 'TempleGroupAssociations';
process.env.ARTIFACTS_TABLE = 'Artifacts';
process.env.PRICE_CONFIGS_TABLE = 'PriceConfigurations';
process.env.PRICE_HISTORY_TABLE = 'PriceHistory';
process.env.FORMULAS_TABLE = 'PricingFormulas';
process.env.FORMULA_HISTORY_TABLE = 'FormulaHistory';
process.env.ACCESS_GRANTS_TABLE = 'AccessGrants';
process.env.OVERRIDES_TABLE = 'PriceOverrides';
process.env.AUDIT_LOG_TABLE = 'AuditLog';
process.env.CONTENT_PACKAGES_TABLE = 'ContentPackages';
process.env.DOWNLOAD_HISTORY_TABLE = 'DownloadHistory';
process.env.QR_CODE_BUCKET = 'temple-qr-codes';
process.env.CONTENT_BUCKET = 'temple-content-packages';
process.env.LOG_LEVEL = 'error';
