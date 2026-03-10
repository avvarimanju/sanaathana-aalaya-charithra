// Trusted Source Types
// Types for managing trusted sources for temple content generation

export type SourceType = 
  | 'temple_official'      // Temple's own official website
  | 'state_authority'      // State endowment department
  | 'heritage_authority'   // ASI, UNESCO, etc.
  | 'custom';              // Custom source added by admin

export type VerificationStatus = 
  | 'verified'             // Verified by admin
  | 'pending'              // Pending verification
  | 'unverified';          // Not yet verified

export interface TrustedSource {
  sourceId: string;                    // Unique identifier (e.g., "source_001")
  sourceName: string;                  // Display name
  sourceUrl: string;                   // Official website URL
  sourceType: SourceType;              // Type of source
  verificationStatus: VerificationStatus;
  verifiedBy?: string;                 // Admin who verified
  verifiedDate?: string;               // ISO date string
  applicableStates?: string[];         // For state authorities
  applicableTemples?: string[];        // For temple-specific sources
  trustScore: number;                  // 1-10 (10 = highest trust)
  isActive: boolean;                   // Active/inactive status
  addedBy: string;                     // Admin who added
  addedDate: string;                   // ISO date string
  updatedBy?: string;                  // Last admin who updated
  updatedDate?: string;                // Last update date
  metadata: {
    description?: string;              // Source description
    contactEmail?: string;             // Contact email
    managementBody?: string;           // Managing organization
    lastChecked?: string;              // Last URL check date
    notes?: string;                    // Admin notes
  };
}

export interface TempleSourceMapping {
  mappingId: string;                   // Unique identifier
  templeId: string;                    // Temple ID
  sourceId: string;                    // Source ID
  isPrimary: boolean;                  // Primary source flag
  priority: number;                    // Priority (1 = highest)
  usedForContentGeneration: boolean;   // Used for AI content
  lastUsed?: string;                   // Last used date
  contentQualityScore?: number;        // 1-10 quality rating
  addedBy: string;                     // Admin who added mapping
  addedDate: string;                   // Date added
}

export interface CreateTrustedSourceRequest {
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  applicableStates?: string[];
  applicableTemples?: string[];
  trustScore?: number;
  metadata?: {
    description?: string;
    contactEmail?: string;
    managementBody?: string;
    notes?: string;
  };
}

export interface UpdateTrustedSourceRequest {
  sourceName?: string;
  sourceUrl?: string;
  sourceType?: SourceType;
  applicableStates?: string[];
  applicableTemples?: string[];
  trustScore?: number;
  isActive?: boolean;
  metadata?: {
    description?: string;
    contactEmail?: string;
    managementBody?: string;
    notes?: string;
  };
}

export interface AddTempleSourceRequest {
  sourceId: string;
  isPrimary?: boolean;
  priority?: number;
  usedForContentGeneration?: boolean;
}

export interface TrustedSourcesResponse {
  sources: TrustedSource[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TempleSourcesResponse {
  templeSources: Array<TrustedSource & { mapping: TempleSourceMapping }>;
  total: number;
}
