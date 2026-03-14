/**
 * Global Configuration for Sanaathana Aalaya Charithra
 * 
 * This file provides centralized configuration management across all workspaces.
 * All environment-specific files should import from this file rather than hardcoding values.
 * 
 * To change AWS region or domain globally, update the .env.global file.
 */

const fs = require('fs');
const path = require('path');

// Load global environment variables
const globalEnvPath = path.join(__dirname, '..', '.env.global');
const globalEnv = {};

if (fs.existsSync(globalEnvPath)) {
  const envContent = fs.readFileSync(globalEnvPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value) {
        globalEnv[key.trim()] = value.trim();
      }
    }
  });
}

// Global configuration object
const globalConfig = {
  // AWS Configuration
  aws: {
    region: globalEnv.AWS_REGION || 'ap-south-1',
    accountId: {
      development: 'local',
      staging: process.env.AWS_STAGING_ACCOUNT_ID || 'your-staging-account-id',
      production: process.env.AWS_PRODUCTION_ACCOUNT_ID || 'your-production-account-id'
    }
  },

  // Domain Configuration
  domains: {
    root: globalEnv.DOMAIN_ROOT || 'charithra.org',
    api: {
      development: 'http://localhost:4000',
      staging: `https://api-staging.${globalEnv.DOMAIN_ROOT || 'charithra.org'}`,
      production: `https://api.${globalEnv.DOMAIN_ROOT || 'charithra.org'}`
    },
    admin: {
      development: 'http://localhost:5173',
      staging: `https://admin-staging.${globalEnv.DOMAIN_ROOT || 'charithra.org'}`,
      production: `https://admin.${globalEnv.DOMAIN_ROOT || 'charithra.org'}`
    },
    mobile: {
      development: 'http://localhost:19006',
      staging: `https://app-staging.${globalEnv.DOMAIN_ROOT || 'charithra.org'}`,
      production: `https://app.${globalEnv.DOMAIN_ROOT || 'charithra.org'}`
    }
  },

  // Repository Configuration
  repository: {
    url: globalEnv.GITHUB_REPO_URL || 'https://github.com/avvarimanju/sanaathana-aalaya-charithra.git',
    owner: 'avvarimanju',
    name: 'sanaathana-aalaya-charithra'
  },

  // Environment-specific helpers
  getConfig: (environment = 'development') => {
    return {
      aws: {
        region: globalConfig.aws.region,
        accountId: globalConfig.aws.accountId[environment]
      },
      domains: {
        api: globalConfig.domains.api[environment],
        admin: globalConfig.domains.admin[environment],
        mobile: globalConfig.domains.mobile[environment]
      },
      repository: globalConfig.repository
    };
  }
};

module.exports = globalConfig;