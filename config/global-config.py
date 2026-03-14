"""
Global Configuration for Sanaathana Aalaya Charithra (Python)

This module provides centralized configuration management for Python code.
All Python files should import from this module rather than hardcoding values.

Usage:
    from config.global_config import GlobalConfig
    
    config = GlobalConfig()
    region = config.aws_region
    domain = config.domain_root
"""

import os
from pathlib import Path
from typing import Dict, Optional


class GlobalConfig:
    """Global configuration manager for the project."""
    
    def __init__(self):
        self._config = self._load_global_config()
    
    def _load_global_config(self) -> Dict[str, str]:
        """Load configuration from .env.global file."""
        config = {}
        
        # Find .env.global file (look up from current directory)
        current_dir = Path(__file__).parent
        global_env_path = None
        
        # Search up the directory tree for .env.global
        for parent in [current_dir] + list(current_dir.parents):
            potential_path = parent / '.env.global'
            if potential_path.exists():
                global_env_path = potential_path
                break
        
        if global_env_path and global_env_path.exists():
            try:
                with open(global_env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        # Skip comments and empty lines
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            config[key.strip()] = value.strip()
            except Exception as e:
                print(f"Warning: Could not load global config: {e}")
        
        return config
    
    @property
    def aws_region(self) -> str:
        """Get AWS region from global config or environment."""
        return os.environ.get('AWS_REGION', 
                            self._config.get('AWS_REGION', 'ap-south-1'))
    
    @property
    def domain_root(self) -> str:
        """Get domain root from global config."""
        return self._config.get('DOMAIN_ROOT', 'charithra.org')
    
    @property
    def github_repo_url(self) -> str:
        """Get GitHub repository URL from global config."""
        return self._config.get('GITHUB_REPO_URL', 
                              'https://github.com/avvarimanju/sanaathana-aalaya-charithra.git')
    
    def get_api_url(self, environment: str = 'development') -> str:
        """Get API URL for specific environment."""
        if environment == 'development':
            return 'http://localhost:4000'
        elif environment == 'staging':
            return f'https://api-staging.{self.domain_root}'
        elif environment == 'production':
            return f'https://api.{self.domain_root}'
        else:
            raise ValueError(f"Unknown environment: {environment}")
    
    def get_admin_url(self, environment: str = 'development') -> str:
        """Get Admin Portal URL for specific environment."""
        if environment == 'development':
            return 'http://localhost:5173'
        elif environment == 'staging':
            return f'https://admin-staging.{self.domain_root}'
        elif environment == 'production':
            return f'https://admin.{self.domain_root}'
        else:
            raise ValueError(f"Unknown environment: {environment}")
    
    def get_mobile_url(self, environment: str = 'development') -> str:
        """Get Mobile App URL for specific environment."""
        if environment == 'development':
            return 'http://localhost:19006'
        elif environment == 'staging':
            return f'https://app-staging.{self.domain_root}'
        elif environment == 'production':
            return f'https://app.{self.domain_root}'
        else:
            raise ValueError(f"Unknown environment: {environment}")
    
    def get_config_dict(self, environment: str = 'development') -> Dict[str, str]:
        """Get complete configuration as dictionary."""
        return {
            'aws_region': self.aws_region,
            'domain_root': self.domain_root,
            'github_repo_url': self.github_repo_url,
            'api_url': self.get_api_url(environment),
            'admin_url': self.get_admin_url(environment),
            'mobile_url': self.get_mobile_url(environment),
            'environment': environment
        }


# Global instance for easy importing
global_config = GlobalConfig()

# Convenience functions for backward compatibility
def get_aws_region() -> str:
    """Get AWS region from global configuration."""
    return global_config.aws_region

def get_domain_root() -> str:
    """Get domain root from global configuration."""
    return global_config.domain_root

def get_api_url(environment: str = 'development') -> str:
    """Get API URL for environment."""
    return global_config.get_api_url(environment)


# Export commonly used values
AWS_REGION = global_config.aws_region
DOMAIN_ROOT = global_config.domain_root
GITHUB_REPO_URL = global_config.github_repo_url