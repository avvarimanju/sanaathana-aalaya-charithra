/**
 * API Service for Sanaathana Aalaya Charithra
 * Making HTTP requests to the backend for temple heritage content
 */

import { API_ENDPOINTS, API_CONFIG, DEMO_MODE } from '../config/api';

export interface QRScanRequest {
  qrData: string;
  sessionId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface QRScanResponse {
  success: boolean;
  data?: {
    artifactIdentifier: {
      artifactId: string;
      siteId: string;
      qrCode: string;
    };
    artifact: {
      name: string;
      type: string;
      description: string;
      historicalContext: string;
      culturalSignificance: string;
    };
    site: {
      name: string;
      location: {
        city: string;
        state: string;
        country: string;
      };
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ContentGenerationRequest {
  artifactId: string;
  siteId: string;
  contentType: 'audio_guide' | 'detailed_description' | 'historical_narrative' | 'cultural_context';
  language: string;
  targetAudience?: 'general' | 'children' | 'scholars';
  duration?: number;
}

export interface ContentGenerationResponse {
  success: boolean;
  data?: {
    content: string;
    audioUrl?: string;
    metadata?: any;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface QARequest {
  question: string;
  sessionId?: string;
  artifactId?: string;
  siteId?: string;
  language: string;
}

export interface QAResponse {
  success: boolean;
  data?: {
    answer: string;
    confidence: number;
    sources?: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

class APIService {
  /**
   * Make HTTP request
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * Scan QR code
   */
  async scanQR(request: QRScanRequest): Promise<QRScanResponse> {
    if (DEMO_MODE) {
      // Return mock data in demo mode
      return this.getMockQRScanResponse(request.qrData);
    }

    return this.request<QRScanResponse>(API_ENDPOINTS.QR_SCAN, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Generate content
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    if (DEMO_MODE) {
      // Return mock data in demo mode
      return this.getMockContentResponse(request);
    }

    return this.request<ContentGenerationResponse>(API_ENDPOINTS.CONTENT_GENERATE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Ask question
   */
  async askQuestion(request: QARequest): Promise<QAResponse> {
    if (DEMO_MODE) {
      // Return mock data in demo mode
      return this.getMockQAResponse(request);
    }

    return this.request<QAResponse>(API_ENDPOINTS.QA_ASK, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request(API_ENDPOINTS.HEALTH, {
      method: 'GET',
    });
  }

  // Mock responses for demo mode
  private getMockQRScanResponse(qrData: string): QRScanResponse {
    const mockData: Record<string, any> = {
      'LP-PILLAR-001': {
        artifactIdentifier: {
          artifactId: 'hanging-pillar',
          siteId: 'lepakshi-temple-andhra',
          qrCode: 'LP-PILLAR-001',
        },
        artifact: {
          name: 'Hanging Pillar',
          type: 'architecture',
          description: 'Mysterious pillar that hangs without touching the ground, architectural marvel',
          historicalContext: 'Built in 16th century, one of 70 pillars in the temple',
          culturalSignificance: 'Engineering wonder that defies gravity, visitors pass objects underneath to verify',
        },
        site: {
          name: 'Lepakshi Temple',
          location: {
            city: 'Lepakshi',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'LP-NANDI-002': {
        artifactIdentifier: {
          artifactId: 'monolithic-nandi',
          siteId: 'lepakshi-temple-andhra',
          qrCode: 'LP-NANDI-002',
        },
        artifact: {
          name: 'Monolithic Nandi',
          type: 'sculpture',
          description: 'Largest monolithic Nandi bull in India, carved from single granite block',
          historicalContext: 'Carved in 16th century, measures 27 feet long and 15 feet high',
          culturalSignificance: 'One of the largest Nandi sculptures in the world',
        },
        site: {
          name: 'Lepakshi Temple',
          location: {
            city: 'Lepakshi',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'LP-PAINT-003': {
        artifactIdentifier: {
          artifactId: 'ceiling-paintings',
          siteId: 'lepakshi-temple-andhra',
          qrCode: 'LP-PAINT-003',
        },
        artifact: {
          name: 'Vijayanagara Ceiling Paintings',
          type: 'painting',
          description: 'Exquisite frescoes depicting scenes from Ramayana, Mahabharata, and Puranas',
          historicalContext: 'Painted in 16th century using natural pigments',
          culturalSignificance: 'Best preserved examples of Vijayanagara mural art',
        },
        site: {
          name: 'Lepakshi Temple',
          location: {
            city: 'Lepakshi',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'TT-DEITY-001': {
        artifactIdentifier: {
          artifactId: 'venkateswara-main-deity',
          siteId: 'tirumala-tirupati-andhra',
          qrCode: 'TT-DEITY-001',
        },
        artifact: {
          name: 'Lord Venkateswara Main Deity',
          type: 'sculpture',
          description: 'Sacred idol of Lord Venkateswara adorned with gold and precious jewels',
          historicalContext: 'Ancient deity worshipped for over 2000 years',
          culturalSignificance: 'Most visited deity in the world, receives offerings worth billions annually',
        },
        site: {
          name: 'Tirumala Venkateswara Temple (TTD)',
          location: {
            city: 'Tirupati',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'TT-GOPURAM-002': {
        artifactIdentifier: {
          artifactId: 'golden-gopuram',
          siteId: 'tirumala-tirupati-andhra',
          qrCode: 'TT-GOPURAM-002',
        },
        artifact: {
          name: 'Golden Gopuram',
          type: 'architecture',
          description: 'Magnificent gold-plated tower at the entrance of the temple',
          historicalContext: 'Gold plating done in recent times, structure dates back centuries',
          culturalSignificance: 'Symbol of the temple\'s wealth and devotion of millions of pilgrims',
        },
        site: {
          name: 'Tirumala Venkateswara Temple (TTD)',
          location: {
            city: 'Tirupati',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'SK-LINGA-001': {
        artifactIdentifier: {
          artifactId: 'vayu-linga',
          siteId: 'srikalahasti-temple-andhra',
          qrCode: 'SK-LINGA-001',
        },
        artifact: {
          name: 'Vayu Linga',
          type: 'sculpture',
          description: 'Self-manifested Shiva Linga representing the element of wind (Vayu)',
          historicalContext: 'Ancient linga worshipped since 5th century',
          culturalSignificance: 'One of the Pancha Bhoota Sthalas, lamp flame flickers without external wind',
        },
        site: {
          name: 'Sri Kalahasti Temple',
          location: {
            city: 'Sri Kalahasti',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'SK-KALAM-002': {
        artifactIdentifier: {
          artifactId: 'kalamkari-paintings',
          siteId: 'srikalahasti-temple-andhra',
          qrCode: 'SK-KALAM-002',
        },
        artifact: {
          name: 'Kalamkari Temple Paintings',
          type: 'painting',
          description: 'Traditional hand-painted Kalamkari art depicting mythological scenes',
          historicalContext: 'Sri Kalahasti is the birthplace of Kalamkari art tradition',
          culturalSignificance: 'UNESCO recognized art form, natural dyes and hand-painted technique',
        },
        site: {
          name: 'Sri Kalahasti Temple',
          location: {
            city: 'Sri Kalahasti',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'SS-JYOTIR-001': {
        artifactIdentifier: {
          artifactId: 'mallikarjuna-jyotirlinga',
          siteId: 'srisailam-temple-andhra',
          qrCode: 'SS-JYOTIR-001',
        },
        artifact: {
          name: 'Mallikarjuna Jyotirlinga',
          type: 'sculpture',
          description: 'One of the 12 sacred Jyotirlingas of Lord Shiva',
          historicalContext: 'Ancient Jyotirlinga mentioned in Puranas, worshipped for thousands of years',
          culturalSignificance: 'Second Jyotirlinga among the 12, represents divine light of Shiva',
        },
        site: {
          name: 'Sri Bhramaramba Mallikarjuna Temple',
          location: {
            city: 'Srisailam',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'SS-SHAKTI-002': {
        artifactIdentifier: {
          artifactId: 'bhramaramba-deity',
          siteId: 'srisailam-temple-andhra',
          qrCode: 'SS-SHAKTI-002',
        },
        artifact: {
          name: 'Goddess Bhramaramba',
          type: 'sculpture',
          description: 'Sacred Shakti Peetha representing the neck of Goddess Sati',
          historicalContext: 'One of the 18 Maha Shakti Peethas, ancient goddess shrine',
          culturalSignificance: 'Represents divine feminine power, completes the Jyotirlinga-Shakti Peetha combination',
        },
        site: {
          name: 'Sri Bhramaramba Mallikarjuna Temple',
          location: {
            city: 'Srisailam',
            state: 'Andhra Pradesh',
            country: 'India',
          },
        },
      },
      'VD-DEITY-001': {
        artifactIdentifier: {
          artifactId: 'narasimha-deity',
          siteId: 'vidurashwatha-temple-karnataka',
          qrCode: 'VD-DEITY-001',
        },
        artifact: {
          name: 'Lakshmi Narasimha Swamy Deity',
          type: 'sculpture',
          description: 'Beautiful idol of Lord Narasimha with Goddess Lakshmi',
          historicalContext: 'Carved during Hoysala period in 12th century',
          culturalSignificance: 'Unique representation of Narasimha in peaceful form with consort',
        },
        site: {
          name: 'Vidurashwatha Temple',
          location: {
            city: 'Vidurashwatha',
            state: 'Karnataka',
            country: 'India',
          },
        },
      },
      'VD-PILLAR-002': {
        artifactIdentifier: {
          artifactId: 'hoysala-pillars',
          siteId: 'vidurashwatha-temple-karnataka',
          qrCode: 'VD-PILLAR-002',
        },
        artifact: {
          name: 'Hoysala Carved Pillars',
          type: 'architecture',
          description: 'Intricately carved pillars showcasing Hoysala architectural style',
          historicalContext: 'Built in 12th-13th century during Hoysala dynasty',
          culturalSignificance: 'Fine example of Hoysala craftsmanship with detailed sculptures',
        },
        site: {
          name: 'Vidurashwatha Temple',
          location: {
            city: 'Vidurashwatha',
            state: 'Karnataka',
            country: 'India',
          },
        },
      },
      'HM-TEMPLE-001': {
        artifactIdentifier: {
          artifactId: 'virupaksha-temple',
          siteId: 'hampi-ruins-karnataka',
          qrCode: 'HM-TEMPLE-001',
        },
        artifact: {
          name: 'Virupaksha Temple',
          type: 'temple',
          description: 'Ancient temple dedicated to Lord Shiva, still in active worship',
          historicalContext: 'Built in 7th century, expanded during Vijayanagara Empire',
          culturalSignificance: 'Oldest functioning temple in India',
        },
        site: {
          name: 'Hampi Ruins',
          location: {
            city: 'Hampi',
            state: 'Karnataka',
            country: 'India',
          },
        },
      },
      'HM-CHARIOT-002': {
        artifactIdentifier: {
          artifactId: 'stone-chariot',
          siteId: 'hampi-ruins-karnataka',
          qrCode: 'HM-CHARIOT-002',
        },
        artifact: {
          name: 'Stone Chariot',
          type: 'sculpture',
          description: 'Iconic stone chariot structure at Vittala Temple',
          historicalContext: 'Built in 16th century during reign of Krishnadevaraya',
          culturalSignificance: 'Symbol of Hampi and masterpiece of Vijayanagara sculpture',
        },
        site: {
          name: 'Hampi Ruins',
          location: {
            city: 'Hampi',
            state: 'Karnataka',
            country: 'India',
          },
        },
      },
    };

    const data = mockData[qrData];
    if (data) {
      return {
        success: true,
        data,
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_QR',
        message: 'QR code not recognized',
      },
    };
  }

  private getMockContentResponse(request: ContentGenerationRequest): ContentGenerationResponse {
    return {
      success: true,
      data: {
        content: `This is a ${request.contentType} for ${request.artifactId} in ${request.language}. The content has been generated using AI to provide you with rich historical and cultural context.`,
        audioUrl: 'https://example.com/audio/sample.mp3',
        metadata: {
          duration: request.duration || 180,
          language: request.language,
        },
      },
    };
  }

  private getMockQAResponse(request: QARequest): QAResponse {
    return {
      success: true,
      data: {
        answer: `This is a mock answer to your question: "${request.question}". In a real deployment, this would be powered by Amazon Bedrock's RAG system with heritage-specific knowledge.`,
        confidence: 0.85,
        sources: ['Heritage Site Database', 'Historical Records'],
      },
    };
  }
}

export const apiService = new APIService();
