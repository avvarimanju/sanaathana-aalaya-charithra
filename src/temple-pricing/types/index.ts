/**
 * Shared TypeScript interfaces and types for Temple Pricing Management
 */

// Entity Types
export type EntityType = 'TEMPLE' | 'GROUP';
export type AccessMode = 'QR_CODE_SCAN' | 'OFFLINE_DOWNLOAD' | 'HYBRID';
export type GrantStatus = 'active' | 'expired' | 'revoked';
export type TempleStatus = 'active' | 'inactive';
export type ArtifactStatus = 'active' | 'inactive';
export type GenerationStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type DownloadStatus = 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type Platform = 'iOS' | 'Android';
export type NetworkType = 'wifi' | 'cellular' | 'unknown';

// Location Interface
export interface Location {
  state: string;
  city: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Temple Interface
export interface Temple {
  templeId: string;
  name: string;
  location: Location;
  description: string;
  activeArtifactCount: number;
  accessMode: AccessMode;
  status: TempleStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

// Temple Group Interface
export interface TempleGroup {
  groupId: string;
  name: string;
  description: string;
  templeIds: string[];
  totalTempleCount: number;
  totalQRCodeCount: number;
  status: TempleStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

// Artifact Interface
export interface Artifact {
  artifactId: string;
  templeId: string;
  name: string;
  description: string;
  qrCodeId: string;
  qrCodeImageUrl: string;
  status: ArtifactStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Price Configuration Interface
export interface PriceConfiguration {
  entityId: string;
  entityType: EntityType;
  priceAmount: number;
  currency: string;
  isFree: boolean;
  effectiveDate: string;
  setBy: string;
  suggestedPrice?: number;
  isOverride: boolean;
  overrideReason?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Price History Interface
export interface PriceHistory {
  entityId: string;
  entityType: EntityType;
  priceAmount: number;
  currency: string;
  effectiveDate: string;
  endDate: string;
  setBy: string;
  suggestedPrice?: number;
  isOverride: boolean;
  overrideReason?: string;
  createdAt: string;
}

// Pricing Formula Interface
export interface PricingFormula {
  formulaId: string;
  category: string;
  basePrice: number;
  perQRCodePrice: number;
  roundingRule: RoundingRule;
  discountFactor: number;
  isActive: boolean;
  effectiveDate: string;
  setBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Rounding Rule Interface
export interface RoundingRule {
  type: 'none' | 'nearest10' | 'nearest99' | 'nearest100';
  direction: 'up' | 'down' | 'nearest';
}

// Access Grant Interface
export interface AccessGrant {
  grantId: string;
  userId: string;
  entityId: string;
  entityType: EntityType;
  paymentId: string;
  paidAmount: number;
  currency: string;
  grantedAt: string;
  expiresAt?: string;
  status: GrantStatus;
  accessMode: AccessMode;
  offlineDownloadPermission: boolean;
}

// Content Package Interface
export interface ContentPackage {
  packageId: string;
  entityId: string;
  entityType: EntityType;
  versionNumber: number;
  packageSize: number;
  compressionType: 'gzip' | 'brotli';
  s3Bucket: string;
  s3Key: string;
  cloudFrontUrl: string;
  contentHash: string;
  artifactCount: number;
  contentManifest: ContentManifest;
  generationStatus: GenerationStatus;
  generationStartedAt?: string;
  generationCompletedAt?: string;
  generationError?: string;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
}

// Content Manifest Interface
export interface ContentManifest {
  textFiles: number;
  imageFiles: number;
  audioFiles: number;
  videoFiles: number;
}

// Download History Interface
export interface DownloadHistory {
  downloadId: string;
  userId: string;
  entityId: string;
  entityType: EntityType;
  packageId: string;
  versionNumber: number;
  packageSize: number;
  downloadStartedAt: string;
  downloadCompletedAt?: string;
  downloadStatus: DownloadStatus;
  downloadProgress: number;
  bytesDownloaded: number;
  downloadSpeed?: number;
  failureReason?: string;
  deviceInfo: DeviceInfo;
  networkType: NetworkType;
}

// Device Info Interface
export interface DeviceInfo {
  platform: Platform;
  osVersion: string;
  appVersion: string;
}

// Audit Log Interface
export interface AuditLog {
  auditId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Request/Response Types
export interface CreateTempleRequest {
  name: string;
  location: Location;
  description: string;
  accessMode?: AccessMode;
}

export interface UpdateTempleRequest {
  name?: string;
  location?: Location;
  description?: string;
  accessMode?: AccessMode;
  status?: TempleStatus;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  templeIds: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface CreateArtifactRequest {
  templeId: string;
  name: string;
  description: string;
}

export interface UpdateArtifactRequest {
  name?: string;
  description?: string;
  status?: ArtifactStatus;
}

export interface PriceConfigRequest {
  entityId: string;
  entityType: EntityType;
  priceAmount: number;
  overrideReason?: string;
}

export interface AccessGrantRequest {
  userId: string;
  entityId: string;
  entityType: EntityType;
  paymentId: string;
  paidAmount: number;
}

export interface DownloadUrlRequest {
  packageId: string;
  userId: string;
}

export interface DownloadUrl {
  url: string;
  expiresAt: string;
  downloadToken: string;
}

// History Filters
export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Pagination
export interface PaginatedResult<T> {
  items: T[];
  nextToken?: string;
  total?: number;
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
  requestId?: string;
  timestamp: string;
}

// Bulk Operations Types
export interface BulkUpdateTempleRequest {
  templeId: string;
  updates: UpdateTempleRequest;
}

export interface BulkUpdateResult {
  successful: BulkOperationSuccess[];
  failed: BulkOperationFailure[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface BulkOperationSuccess {
  entityId: string;
  message: string;
}

export interface BulkOperationFailure {
  entityId: string;
  error: string;
  details?: string;
}

export interface BulkDeleteResult {
  successful: BulkOperationSuccess[];
  failed: BulkOperationFailure[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}
