/**
 * Global Configuration for Sanaathana Aalaya Charithra (TypeScript)
 * 
 * This file provides centralized configuration management for TypeScript code.
 * All TypeScript files should import from this module rather than hardcoding values.
 * 
 * Usage:
 *   import { globalConfig } from '../config/global-config';
 *   const region = globalConfig.aws.region;
 *   const apiUrl = globalConfig.getApiUrl('production');
 */

import * as fs from 'fs';
import * as path from 'path';

interface GlobalConfigData {
  AWS_REGION: string;
  DOMAIN_ROOT: string;
  GITHUB_REPO_URL: string;
}

interface EnvironmentUrls {
  api: string;
  admin: string;
  mobile: string;
}

interface AwsConfig {
  region: string;
  accountId: {
    development: string;
    staging: string;
    production: string;
  };
}

interface DomainsConfig {
  root: string;
  api: Record<string, string>;
  admin: Record<string, string>;
  mobile: Record<string, string>;
}

interface RepositoryConfig {
  url: string;
  owner: string;
  name: string;
}

interface EnvironmentConfig {
  aws: {
    region: string;
    accountId: string;
  };
  domains: EnvironmentUrls;
  repository: RepositoryConfig;
}

class GlobalConfig {
  private config: GlobalConfigData;

  constructor() {
    this.config = this.loadGlobalConfig();
  }

  private loadGlobalConfig(): GlobalConfigData {
    const config: Partial<GlobalConfigData> = {};
    
    // Find .env.global file (look up from current directory)
    const currentDir = __dirname;
    let globalEnvPath: string | null = null;
    
    // Search up the directory tree for .env.global
    const searchPaths = [
      path.join(currentDir, '..', '.env.global'),
      path.join(currentDir, '..', '..', '.env.global'),
      path.join(currentDir, '..', '..', '..', '.env.global'),
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        globalEnvPath = searchPath;
        break;
      }
    }
    
    if (globalEnvPath && fs.existsSync(globalEnvPath)) {
      try {
        const content = fs.readFileSync(globalEnvPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
            const [key, value] = trimmedLine.split('=', 2);
            if (key && value) {
              (config as any)[key.trim()] = value.trim();
            }
          }
        });
      } catch (error) {
        console.warn(`Warning: Could not load global config: ${error}`);
      }
    }
    
    // Return with defaults
    return {
      AWS_REGION: config.AWS_REGION || 'ap-south-1',
      DOMAIN_ROOT: config.DOMAIN_ROOT || 'charithra.org',
      GITHUB_REPO_URL: config.GITHUB_REPO_URL || 'https://github.com/avvarimanju/sanaathana-aalaya-charithra.git'
    };
  }

  get aws(): AwsConfig {
    return {
      region: process.env.AWS_REGION || this.config.AWS_REGION,
      accountId: {
        development: 'local',
        staging: process.env.AWS_STAGING_ACCOUNT_ID || 'your-staging-account-id',
        production: process.env.AWS_PRODUCTION_ACCOUNT_ID || 'your-production-account-id'
      }
    };
  }

  get domains(): DomainsConfig {
    const root = this.config.DOMAIN_ROOT;
    return {
      root,
      api: {
        development: 'http://localhost:4000',
        staging: `https://api-staging.${root}`,
        production: `https://api.${root}`
      },
      admin: {
        development: 'http://localhost:5173',
        staging: `https://admin-staging.${root}`,
        production: `https://admin.${root}`
      },
      mobile: {
        development: 'http://localhost:19006',
        staging: `https://app-staging.${root}`,
        production: `https://app.${root}`
      }
    };
  }

  get repository(): RepositoryConfig {
    return {
      url: this.config.GITHUB_REPO_URL,
      owner: 'avvarimanju',
      name: 'sanaathana-aalaya-charithra'
    };
  }

  getConfig(environment: string = 'development'): EnvironmentConfig {
    return {
      aws: {
        region: this.aws.region,
        accountId: this.aws.accountId[environment as keyof typeof this.aws.accountId] || this.aws.accountId.development
      },
      domains: {
        api: this.domains.api[environment] || this.domains.api.development,
        admin: this.domains.admin[environment] || this.domains.admin.development,
        mobile: this.domains.mobile[environment] || this.domains.mobile.development
      },
      repository: this.repository
    };
  }

  getApiUrl(environment: string = 'development'): string {
    return this.domains.api[environment] || this.domains.api.development;
  }

  getAdminUrl(environment: string = 'development'): string {
    return this.domains.admin[environment] || this.domains.admin.development;
  }

  getMobileUrl(environment: string = 'development'): string {
    return this.domains.mobile[environment] || this.domains.mobile.development;
  }
}

// Global instance for easy importing
export const globalConfig = new GlobalConfig();

// Convenience exports for backward compatibility
export const AWS_REGION = globalConfig.aws.region;
export const DOMAIN_ROOT = globalConfig.domains.root;
export const GITHUB_REPO_URL = globalConfig.repository.url;

// Type exports
export type { EnvironmentConfig, AwsConfig, DomainsConfig, RepositoryConfig };

export default globalConfig;