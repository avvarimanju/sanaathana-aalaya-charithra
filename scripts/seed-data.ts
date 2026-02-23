#!/usr/bin/env ts-node
/**
 * Seed script to populate DynamoDB with Hindu temple heritage sites and artifacts
 * Sanaathana Aalaya Charithra - Eternal Temple History
 * Run this after deploying the infrastructure to AWS
 */

import { RepositoryFactory } from '../src/repositories';
import { HeritageSite, ArtifactReference, ArtifactType } from '../src/models/common';
import { Language } from '../src/models/common';

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  const sitesRepo = RepositoryFactory.getHeritageSitesRepository();
  const artifactsRepo = RepositoryFactory.getArtifactsRepository();

  try {
    // Seed Heritage Sites
    console.log('📍 Creating heritage sites...');

    const sites: Omit<HeritageSite, 'createdAt' | 'updatedAt'>[] = [
      {
        siteId: 'lepakshi-temple-andhra',
        name: 'Lepakshi Temple',
        location: {
          address: 'Lepakshi, Hindupur Taluk, Anantapur District, Andhra Pradesh 515331',
          city: 'Lepakshi',
          state: 'Andhra Pradesh',
          country: 'India',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        description: 'Magnificent Veerabhadra Temple known for its hanging pillar and stunning frescoes',
        historicalContext: 'Built in 16th century during Vijayanagara Empire by brothers Virupanna and Viranna',
        culturalSignificance: 'Famous for its architectural marvel of hanging pillar, largest monolithic Nandi, and exquisite Vijayanagara paintings',
        visitingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
        entryFee: {
          indian: 25,
          foreign: 300,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TELUGU,
          Language.HINDI,
          Language.KANNADA,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'photography_allowed'],
        contactInfo: {
          phone: '+91-8555-252-239',
          email: 'lepakshi@asi.gov.in',
          website: 'https://www.asi.gov.in',
        },
        isActive: true,
      },
      {
        siteId: 'tirumala-tirupati-andhra',
        name: 'Tirumala Venkateswara Temple (TTD)',
        location: {
          address: 'Tirumala Hills, Tirupati, Chittoor District, Andhra Pradesh 517504',
          city: 'Tirupati',
          state: 'Andhra Pradesh',
          country: 'India',
          coordinates: {
            latitude: 13.6833,
            longitude: 79.3472,
          },
        },
        description: 'World\'s richest temple dedicated to Lord Venkateswara, receives millions of pilgrims annually',
        historicalContext: 'Ancient temple with references dating back to 300 CE, current structure built by various dynasties',
        culturalSignificance: 'Most visited Hindu temple in the world, managed by Tirumala Tirupati Devasthanams (TTD)',
        visitingHours: {
          monday: { open: '02:30', close: '01:00' },
          tuesday: { open: '02:30', close: '01:00' },
          wednesday: { open: '02:30', close: '01:00' },
          thursday: { open: '02:30', close: '01:00' },
          friday: { open: '02:30', close: '01:00' },
          saturday: { open: '02:30', close: '01:00' },
          sunday: { open: '02:30', close: '01:00' },
        },
        entryFee: {
          indian: 0,
          foreign: 0,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TELUGU,
          Language.HINDI,
          Language.TAMIL,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'prasadam_counter', 'accommodation', 'free_meals'],
        contactInfo: {
          phone: '+91-877-227-7777',
          email: 'info@tirumala.org',
          website: 'https://www.tirumala.org',
        },
        isActive: true,
      },
      {
        siteId: 'srikalahasti-temple-andhra',
        name: 'Sri Kalahasti Temple',
        location: {
          address: 'Sri Kalahasti, Chittoor District, Andhra Pradesh 517644',
          city: 'Sri Kalahasti',
          state: 'Andhra Pradesh',
          country: 'India',
          coordinates: {
            latitude: 13.7500,
            longitude: 79.7000,
          },
        },
        description: 'Ancient Shiva temple famous for Rahu-Ketu pooja and Vayu Linga',
        historicalContext: 'Built in 5th century, expanded by Chola and Vijayanagara rulers',
        culturalSignificance: 'One of the Pancha Bhoota Sthalas representing Vayu (wind), famous for Kalamkari art',
        visitingHours: {
          monday: { open: '06:00', close: '21:00' },
          tuesday: { open: '06:00', close: '21:00' },
          wednesday: { open: '06:00', close: '21:00' },
          thursday: { open: '06:00', close: '21:00' },
          friday: { open: '06:00', close: '21:00' },
          saturday: { open: '06:00', close: '21:00' },
          sunday: { open: '06:00', close: '21:00' },
        },
        entryFee: {
          indian: 0,
          foreign: 0,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TELUGU,
          Language.HINDI,
          Language.TAMIL,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'prasadam_counter', 'kalamkari_art_center'],
        contactInfo: {
          phone: '+91-8578-222-777',
          email: 'srikalahasti@aptemples.ap.gov.in',
          website: 'https://www.srikalahasti.org',
        },
        isActive: true,
      },
      {
        siteId: 'srisailam-temple-andhra',
        name: 'Sri Bhramaramba Mallikarjuna Temple',
        location: {
          address: 'Srisailam, Kurnool District, Andhra Pradesh 518101',
          city: 'Srisailam',
          state: 'Andhra Pradesh',
          country: 'India',
          coordinates: {
            latitude: 16.0736,
            longitude: 78.8683,
          },
        },
        description: 'One of the 12 Jyotirlinga temples dedicated to Lord Shiva and Shakti Peetha of Goddess Bhramaramba',
        historicalContext: 'Ancient temple mentioned in Skanda Purana and Shiva Purana, rebuilt by various dynasties including Vijayanagara',
        culturalSignificance: 'One of the most sacred pilgrimage sites, combines both Jyotirlinga and Shakti Peetha significance',
        visitingHours: {
          monday: { open: '04:00', close: '22:00' },
          tuesday: { open: '04:00', close: '22:00' },
          wednesday: { open: '04:00', close: '22:00' },
          thursday: { open: '04:00', close: '22:00' },
          friday: { open: '04:00', close: '22:00' },
          saturday: { open: '04:00', close: '22:00' },
          sunday: { open: '04:00', close: '22:00' },
        },
        entryFee: {
          indian: 0,
          foreign: 0,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TELUGU,
          Language.HINDI,
          Language.KANNADA,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'prasadam_counter', 'accommodation', 'ropeway'],
        contactInfo: {
          phone: '+91-8524-287-222',
          email: 'srisailam@aptemples.ap.gov.in',
          website: 'https://www.srisailadevasthanam.org',
        },
        isActive: true,
      },
      {
        siteId: 'vidurashwatha-temple-karnataka',
        name: 'Vidurashwatha Temple',
        location: {
          address: 'Vidurashwatha, Chikkaballapur District, Karnataka 562120',
          city: 'Vidurashwatha',
          state: 'Karnataka',
          country: 'India',
          coordinates: {
            latitude: 13.4167,
            longitude: 77.7833,
          },
        },
        description: 'Ancient Lakshmi Narasimha Swamy temple with unique architecture',
        historicalContext: 'Built during Hoysala period in 12th-13th century',
        culturalSignificance: 'Known for its beautiful Hoysala architecture and annual Rathotsava festival',
        visitingHours: {
          monday: { open: '06:00', close: '20:00' },
          tuesday: { open: '06:00', close: '20:00' },
          wednesday: { open: '06:00', close: '20:00' },
          thursday: { open: '06:00', close: '20:00' },
          friday: { open: '06:00', close: '20:00' },
          saturday: { open: '06:00', close: '20:00' },
          sunday: { open: '06:00', close: '20:00' },
        },
        entryFee: {
          indian: 0,
          foreign: 0,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.KANNADA,
          Language.TELUGU,
          Language.HINDI,
        ],
        amenities: ['parking', 'restrooms', 'prasadam_counter', 'festival_celebrations'],
        contactInfo: {
          phone: '+91-8156-272-100',
          email: 'vidurashwatha@temples.kar.in',
          website: 'https://www.vidurashwatha.org',
        },
        isActive: true,
      },
      {
        siteId: 'hampi-ruins-karnataka',
        name: 'Hampi Ruins',
        location: {
          address: 'Hampi, Karnataka 583239',
          city: 'Hampi',
          state: 'Karnataka',
          country: 'India',
          coordinates: {
            latitude: 15.3350,
            longitude: 76.4600,
          },
        },
        description: 'Ancient village featuring ruins of Vijayanagara Empire',
        historicalContext: 'Capital of the Vijayanagara Empire from 1336 to 1565',
        culturalSignificance: 'UNESCO World Heritage Site with over 1,600 monuments',
        visitingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
        entryFee: {
          indian: 40,
          foreign: 600,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.HINDI,
          Language.KANNADA,
          Language.TELUGU,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'bicycle_rental'],
        contactInfo: {
          phone: '+91-8394-241-339',
          email: 'hampi@asi.gov.in',
          website: 'https://www.hampi.in',
        },
        isActive: true,
      },
      {
        siteId: 'lepakshi-temple-andhra',
        name: 'Lepakshi Temple',
        location: {
          address: 'Lepakshi, Hindupur Taluk, Anantapur District, Andhra Pradesh 515331',
          city: 'Lepakshi',
          state: 'Andhra Pradesh',
          country: 'India',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        description: 'Magnificent Veerabhadra Temple known for its hanging pillar and stunning frescoes',
        historicalContext: 'Built in 16th century during Vijayanagara Empire by brothers Virupanna and Viranna',
        culturalSignificance: 'Famous for its architectural marvel of hanging pillar, largest monolithic Nandi, and exquisite Vijayanagara paintings',
        visitingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
        entryFee: {
          indian: 25,
          foreign: 300,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TELUGU,
          Language.HINDI,
          Language.KANNADA,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'photography_allowed'],
        contactInfo: {
          phone: '+91-8555-252-239',
          email: 'lepakshi@asi.gov.in',
          website: 'https://www.asi.gov.in',
        },
        isActive: true,
      },
      {
        siteId: 'halebidu-temple-karnataka',
        name: 'Halebidu Hoysaleswara Temple',
        location: {
          address: 'Halebidu, Hassan District, Karnataka 573121',
          city: 'Halebidu',
          state: 'Karnataka',
          country: 'India',
          coordinates: {
            latitude: 13.2172,
            longitude: 75.9961,
          },
        },
        description: 'Masterpiece of Hoysala architecture with intricate stone carvings',
        historicalContext: 'Built in 12th century by King Vishnuvardhana, capital of Hoysala Empire',
        culturalSignificance: 'UNESCO World Heritage Site, finest example of Hoysala temple architecture with detailed sculptures',
        visitingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
        entryFee: {
          indian: 30,
          foreign: 500,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.KANNADA,
          Language.HINDI,
          Language.TAMIL,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'museum', 'cafeteria'],
        contactInfo: {
          phone: '+91-8177-273-041',
          email: 'halebidu@asi.gov.in',
          website: 'https://www.asi.gov.in',
        },
        isActive: true,
      },
      {
        siteId: 'belur-temple-karnataka',
        name: 'Belur Chennakeshava Temple',
        location: {
          address: 'Belur, Hassan District, Karnataka 573115',
          city: 'Belur',
          state: 'Karnataka',
          country: 'India',
          coordinates: {
            latitude: 13.1656,
            longitude: 75.8653,
          },
        },
        description: 'Exquisite Hoysala temple dedicated to Lord Vishnu with stunning sculptures',
        historicalContext: 'Built in 1117 CE by King Vishnuvardhana to commemorate victory over Cholas',
        culturalSignificance: 'UNESCO World Heritage Site, epitome of Hoysala craftsmanship with 48 pillars and intricate carvings',
        visitingHours: {
          monday: { open: '06:00', close: '19:00' },
          tuesday: { open: '06:00', close: '19:00' },
          wednesday: { open: '06:00', close: '19:00' },
          thursday: { open: '06:00', close: '19:00' },
          friday: { open: '06:00', close: '19:00' },
          saturday: { open: '06:00', close: '19:00' },
          sunday: { open: '06:00', close: '19:00' },
        },
        entryFee: {
          indian: 30,
          foreign: 500,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.KANNADA,
          Language.HINDI,
          Language.TAMIL,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'photography_allowed'],
        contactInfo: {
          phone: '+91-8177-222-218',
          email: 'belur@asi.gov.in',
          website: 'https://www.asi.gov.in',
        },
        isActive: true,
      },
      {
        siteId: 'thanjavur-temple-tamilnadu',
        name: 'Brihadeeswarar Temple (Big Temple)',
        location: {
          address: 'Thanjavur, Tamil Nadu 613007',
          city: 'Thanjavur',
          state: 'Tamil Nadu',
          country: 'India',
          coordinates: {
            latitude: 10.7825,
            longitude: 79.1314,
          },
        },
        description: 'Magnificent Chola temple with 216-foot tall vimana, one of the tallest in the world',
        historicalContext: 'Built by Raja Raja Chola I in 1010 CE, masterpiece of Chola architecture',
        culturalSignificance: 'UNESCO World Heritage Site, exemplifies Dravidian architecture and Chola artistic excellence',
        visitingHours: {
          monday: { open: '06:00', close: '20:30' },
          tuesday: { open: '06:00', close: '20:30' },
          wednesday: { open: '06:00', close: '20:30' },
          thursday: { open: '06:00', close: '20:30' },
          friday: { open: '06:00', close: '20:30' },
          saturday: { open: '06:00', close: '20:30' },
          sunday: { open: '06:00', close: '20:30' },
        },
        entryFee: {
          indian: 50,
          foreign: 500,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TAMIL,
          Language.HINDI,
          Language.TELUGU,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'museum', 'audio_guides'],
        contactInfo: {
          phone: '+91-4362-274-677',
          email: 'thanjavur@asi.gov.in',
          website: 'https://www.asi.gov.in',
        },
        isActive: true,
      },
      {
        siteId: 'ellora-caves-maharashtra',
        name: 'Ellora Caves',
        location: {
          address: 'Ellora, Aurangabad District, Maharashtra 431102',
          city: 'Aurangabad',
          state: 'Maharashtra',
          country: 'India',
          coordinates: {
            latitude: 20.0269,
            longitude: 75.1795,
          },
        },
        description: 'Rock-cut cave temples representing Buddhist, Hindu, and Jain monuments',
        historicalContext: 'Carved between 6th and 10th centuries CE, showcasing religious harmony',
        culturalSignificance: 'UNESCO World Heritage Site, Kailasa temple (Cave 16) is the largest monolithic rock excavation in the world',
        visitingHours: {
          monday: { open: 'closed', close: 'closed' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
        entryFee: {
          indian: 40,
          foreign: 600,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.HINDI,
          Language.MARATHI,
          Language.GUJARATI,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'audio_guides', 'cafeteria', 'museum'],
        contactInfo: {
          phone: '+91-2437-244-742',
          email: 'ellora@asi.gov.in',
          website: 'https://www.asi.gov.in',
        },
        isActive: true,
      },
      {
        siteId: 'meenakshi-temple-tamilnadu',
        name: 'Meenakshi Amman Temple',
        location: {
          address: 'Madurai Main, Madurai, Tamil Nadu 625001',
          city: 'Madurai',
          state: 'Tamil Nadu',
          country: 'India',
          coordinates: {
            latitude: 9.9195,
            longitude: 78.1193,
          },
        },
        description: 'Historic Hindu temple dedicated to Goddess Meenakshi with towering gopurams',
        historicalContext: 'Ancient temple rebuilt in 17th century by Nayak rulers, mentioned in Tamil Sangam literature',
        culturalSignificance: 'One of the most prominent temples in India, known for 14 magnificent gopurams and Hall of Thousand Pillars',
        visitingHours: {
          monday: { open: '05:00', close: '21:30' },
          tuesday: { open: '05:00', close: '21:30' },
          wednesday: { open: '05:00', close: '21:30' },
          thursday: { open: '05:00', close: '21:30' },
          friday: { open: '05:00', close: '21:30' },
          saturday: { open: '05:00', close: '21:30' },
          sunday: { open: '05:00', close: '21:30' },
        },
        entryFee: {
          indian: 50,
          foreign: 50,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.TAMIL,
          Language.HINDI,
          Language.TELUGU,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'prasadam_counter', 'photography_restricted'],
        contactInfo: {
          phone: '+91-452-234-4360',
          email: 'meenakshi@tnhrce.in',
          website: 'https://www.maduraimeenakshi.org',
        },
        isActive: true,
      },
      {
        siteId: 'khajuraho-temples-madhyapradesh',
        name: 'Khajuraho Group of Monuments',
        location: {
          address: 'Khajuraho, Chhatarpur District, Madhya Pradesh 471606',
          city: 'Khajuraho',
          state: 'Madhya Pradesh',
          country: 'India',
          coordinates: {
            latitude: 24.8318,
            longitude: 79.9199,
          },
        },
        description: 'Stunning temples famous for their nagara-style architecture and erotic sculptures',
        historicalContext: 'Built between 950-1050 CE by Chandela dynasty rulers',
        culturalSignificance: 'UNESCO World Heritage Site, represents the pinnacle of Indian architectural and sculptural art',
        visitingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
        entryFee: {
          indian: 40,
          foreign: 600,
          currency: 'INR',
        },
        supportedLanguages: [
          Language.ENGLISH,
          Language.HINDI,
          Language.MARATHI,
          Language.GUJARATI,
        ],
        amenities: ['parking', 'restrooms', 'guided_tours', 'audio_guides', 'museum', 'light_sound_show'],
        contactInfo: {
          phone: '+91-7686-272-320',
          email: 'khajuraho@asi.gov.in',
          website: 'https://www.khajuraho.nic.in',
        },
        isActive: true,
      },
    ];

    for (const site of sites) {
      const result = await sitesRepo.create(site);
      if (result) {
        console.log(`✅ Created site: ${site.name} (${site.siteId})`);
      } else {
        console.log(`⚠️  Failed to create site: ${site.name}`);
      }
    }

    console.log('\n🗿 Creating artifacts...');

    // Seed Artifacts for Lepakshi Temple
    const lepakshiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'hanging-pillar',
        siteId: 'lepakshi-temple-andhra',
        name: 'Hanging Pillar',
        type: ArtifactType.ARCHITECTURE,
        description: 'Mysterious pillar that hangs without touching the ground, architectural marvel',
        historicalContext: 'Built in 16th century, one of 70 pillars in the temple',
        culturalSignificance: 'Engineering wonder that defies gravity, visitors pass objects underneath to verify',
        location: {
          floor: 'Ground',
          section: 'Main Hall',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        qrCode: 'LP-PILLAR-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['pillar', 'architecture', 'mystery', 'engineering'],
        isActive: true,
      },
      {
        artifactId: 'monolithic-nandi',
        siteId: 'lepakshi-temple-andhra',
        name: 'Monolithic Nandi',
        type: ArtifactType.SCULPTURE,
        description: 'Largest monolithic Nandi bull in India, carved from single granite block',
        historicalContext: 'Carved in 16th century, measures 27 feet long and 15 feet high',
        culturalSignificance: 'One of the largest Nandi sculptures in the world',
        location: {
          floor: 'Ground',
          section: 'Temple Entrance',
          coordinates: {
            latitude: 13.8285,
            longitude: 77.6035,
          },
        },
        qrCode: 'LP-NANDI-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['nandi', 'sculpture', 'monolithic', 'largest'],
        isActive: true,
      },
      {
        artifactId: 'ceiling-paintings',
        siteId: 'lepakshi-temple-andhra',
        name: 'Vijayanagara Ceiling Paintings',
        type: ArtifactType.PAINTING,
        description: 'Exquisite frescoes depicting scenes from Ramayana, Mahabharata, and Puranas',
        historicalContext: 'Painted in 16th century using natural pigments',
        culturalSignificance: 'Best preserved examples of Vijayanagara mural art',
        location: {
          floor: 'Ground',
          section: 'Main Hall Ceiling',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        qrCode: 'LP-PAINT-003',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['paintings', 'frescoes', 'vijayanagara', 'art'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Tirumala Tirupati
    const tirupatiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'venkateswara-main-deity',
        siteId: 'tirumala-tirupati-andhra',
        name: 'Lord Venkateswara Main Deity',
        type: ArtifactType.SCULPTURE,
        description: 'Sacred idol of Lord Venkateswara adorned with gold and precious jewels',
        historicalContext: 'Ancient deity worshipped for over 2000 years',
        culturalSignificance: 'Most visited deity in the world, receives offerings worth billions annually',
        location: {
          floor: 'Ground',
          section: 'Garbha Griha (Sanctum)',
          coordinates: {
            latitude: 13.6833,
            longitude: 79.3472,
          },
        },
        qrCode: 'TT-DEITY-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['deity', 'venkateswara', 'vishnu', 'sacred'],
        isActive: true,
      },
      {
        artifactId: 'golden-gopuram',
        siteId: 'tirumala-tirupati-andhra',
        name: 'Golden Gopuram',
        type: ArtifactType.ARCHITECTURE,
        description: 'Magnificent gold-plated tower at the entrance of the temple',
        historicalContext: 'Gold plating done in recent times, structure dates back centuries',
        culturalSignificance: 'Symbol of the temple\'s wealth and devotion of millions of pilgrims',
        location: {
          floor: 'Ground',
          section: 'Main Entrance',
          coordinates: {
            latitude: 13.6834,
            longitude: 79.3473,
          },
        },
        qrCode: 'TT-GOPURAM-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['gopuram', 'gold', 'architecture', 'entrance'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Sri Kalahasti
    const kalahastArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'vayu-linga',
        siteId: 'srikalahasti-temple-andhra',
        name: 'Vayu Linga',
        type: ArtifactType.SCULPTURE,
        description: 'Self-manifested Shiva Linga representing the element of wind (Vayu)',
        historicalContext: 'Ancient linga worshipped since 5th century',
        culturalSignificance: 'One of the Pancha Bhoota Sthalas, lamp flame flickers without external wind',
        location: {
          floor: 'Ground',
          section: 'Sanctum Sanctorum',
          coordinates: {
            latitude: 13.7500,
            longitude: 79.7000,
          },
        },
        qrCode: 'SK-LINGA-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['linga', 'shiva', 'vayu', 'pancha-bhoota'],
        isActive: true,
      },
      {
        artifactId: 'kalamkari-paintings',
        siteId: 'srikalahasti-temple-andhra',
        name: 'Kalamkari Temple Paintings',
        type: ArtifactType.PAINTING,
        description: 'Traditional hand-painted Kalamkari art depicting mythological scenes',
        historicalContext: 'Sri Kalahasti is the birthplace of Kalamkari art tradition',
        culturalSignificance: 'UNESCO recognized art form, natural dyes and hand-painted technique',
        location: {
          floor: 'Ground',
          section: 'Temple Walls',
          coordinates: {
            latitude: 13.7501,
            longitude: 79.7001,
          },
        },
        qrCode: 'SK-KALAM-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['kalamkari', 'painting', 'art', 'traditional'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Srisailam
    const srisailamArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'mallikarjuna-jyotirlinga',
        siteId: 'srisailam-temple-andhra',
        name: 'Mallikarjuna Jyotirlinga',
        type: ArtifactType.SCULPTURE,
        description: 'One of the 12 sacred Jyotirlingas of Lord Shiva',
        historicalContext: 'Ancient Jyotirlinga mentioned in Puranas, worshipped for thousands of years',
        culturalSignificance: 'Second Jyotirlinga among the 12, represents divine light of Shiva',
        location: {
          floor: 'Ground',
          section: 'Main Sanctum',
          coordinates: {
            latitude: 16.0736,
            longitude: 78.8683,
          },
        },
        qrCode: 'SS-JYOTIR-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['jyotirlinga', 'shiva', 'sacred', 'pilgrimage'],
        isActive: true,
      },
      {
        artifactId: 'bhramaramba-deity',
        siteId: 'srisailam-temple-andhra',
        name: 'Goddess Bhramaramba',
        type: ArtifactType.SCULPTURE,
        description: 'Sacred Shakti Peetha representing the neck of Goddess Sati',
        historicalContext: 'One of the 18 Maha Shakti Peethas, ancient goddess shrine',
        culturalSignificance: 'Represents divine feminine power, completes the Jyotirlinga-Shakti Peetha combination',
        location: {
          floor: 'Ground',
          section: 'Goddess Sanctum',
          coordinates: {
            latitude: 16.0737,
            longitude: 78.8684,
          },
        },
        qrCode: 'SS-SHAKTI-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['shakti-peetha', 'goddess', 'bhramaramba', 'divine-feminine'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Vidurashwatha
    const vidurashwathaArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'narasimha-deity',
        siteId: 'vidurashwatha-temple-karnataka',
        name: 'Lakshmi Narasimha Swamy Deity',
        type: ArtifactType.SCULPTURE,
        description: 'Beautiful idol of Lord Narasimha with Goddess Lakshmi',
        historicalContext: 'Carved during Hoysala period in 12th century',
        culturalSignificance: 'Unique representation of Narasimha in peaceful form with consort',
        location: {
          floor: 'Ground',
          section: 'Main Sanctum',
          coordinates: {
            latitude: 13.4167,
            longitude: 77.7833,
          },
        },
        qrCode: 'VD-DEITY-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['narasimha', 'vishnu', 'hoysala', 'deity'],
        isActive: true,
      },
      {
        artifactId: 'hoysala-pillars',
        siteId: 'vidurashwatha-temple-karnataka',
        name: 'Hoysala Carved Pillars',
        type: ArtifactType.ARCHITECTURE,
        description: 'Intricately carved pillars showcasing Hoysala architectural style',
        historicalContext: 'Built in 12th-13th century during Hoysala dynasty',
        culturalSignificance: 'Fine example of Hoysala craftsmanship with detailed sculptures',
        location: {
          floor: 'Ground',
          section: 'Main Hall',
          coordinates: {
            latitude: 13.4167,
            longitude: 77.7834,
          },
        },
        qrCode: 'VD-PILLAR-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['pillars', 'hoysala', 'architecture', 'carved'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Hampi
    const hampiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'virupaksha-temple',
        siteId: 'hampi-ruins-karnataka',
        name: 'Virupaksha Temple',
        type: ArtifactType.TEMPLE,
        description: 'Ancient temple dedicated to Lord Shiva, still in active worship',
        historicalContext: 'Built in 7th century, expanded during Vijayanagara Empire',
        culturalSignificance: 'Oldest functioning temple in India',
        location: {
          floor: 'Ground',
          section: 'Temple Complex',
          coordinates: {
            latitude: 15.3350,
            longitude: 76.4600,
          },
        },
        qrCode: 'HM-TEMPLE-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['temple', 'shiva', 'vijayanagara', 'active-worship'],
        isActive: true,
      },
      {
        artifactId: 'stone-chariot',
        siteId: 'hampi-ruins-karnataka',
        name: 'Stone Chariot',
        type: ArtifactType.SCULPTURE,
        description: 'Iconic stone chariot structure at Vittala Temple',
        historicalContext: 'Built in 16th century during reign of Krishnadevaraya',
        culturalSignificance: 'Symbol of Hampi and masterpiece of Vijayanagara sculpture',
        location: {
          floor: 'Ground',
          section: 'Vittala Temple Complex',
          coordinates: {
            latitude: 15.3352,
            longitude: 76.4602,
          },
        },
        qrCode: 'HM-CHARIOT-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['chariot', 'sculpture', 'vittala-temple', 'iconic'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Lepakshi Temple
    const lepakshiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'hanging-pillar',
        siteId: 'lepakshi-temple-andhra',
        name: 'Hanging Pillar',
        type: ArtifactType.ARCHITECTURE,
        description: 'Mysterious pillar that hangs without touching the ground, architectural marvel',
        historicalContext: 'Built in 16th century, one of 70 pillars in the temple',
        culturalSignificance: 'Engineering wonder that defies gravity, visitors pass objects underneath to verify',
        location: {
          floor: 'Ground',
          section: 'Main Hall',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        qrCode: 'LP-PILLAR-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['pillar', 'architecture', 'mystery', 'engineering'],
        isActive: true,
      },
      {
        artifactId: 'monolithic-nandi',
        siteId: 'lepakshi-temple-andhra',
        name: 'Monolithic Nandi',
        type: ArtifactType.SCULPTURE,
        description: 'Largest monolithic Nandi bull in India, carved from single granite block',
        historicalContext: 'Carved in 16th century, measures 27 feet long and 15 feet high',
        culturalSignificance: 'One of the largest Nandi sculptures in the world',
        location: {
          floor: 'Ground',
          section: 'Temple Entrance',
          coordinates: {
            latitude: 13.8285,
            longitude: 77.6035,
          },
        },
        qrCode: 'LP-NANDI-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['nandi', 'sculpture', 'monolithic', 'largest'],
        isActive: true,
      },
      {
        artifactId: 'ceiling-paintings',
        siteId: 'lepakshi-temple-andhra',
        name: 'Vijayanagara Ceiling Paintings',
        type: ArtifactType.PAINTING,
        description: 'Exquisite frescoes depicting scenes from Ramayana, Mahabharata, and Puranas',
        historicalContext: 'Painted in 16th century using natural pigments',
        culturalSignificance: 'Best preserved examples of Vijayanagara mural art',
        location: {
          floor: 'Ground',
          section: 'Main Hall Ceiling',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        qrCode: 'LP-PAINT-003',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['paintings', 'frescoes', 'vijayanagara', 'art'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Lepakshi Temple
    const lepakshiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'hanging-pillar',
        siteId: 'lepakshi-temple-andhra',
        name: 'Hanging Pillar',
        type: ArtifactType.ARCHITECTURE,
        description: 'Mysterious pillar that hangs without touching the ground, architectural marvel',
        historicalContext: 'Built in 16th century, one of 70 pillars in the temple',
        culturalSignificance: 'Engineering wonder that defies gravity, visitors pass objects underneath to verify',
        location: {
          floor: 'Ground',
          section: 'Main Hall',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        qrCode: 'LP-PILLAR-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['pillar', 'architecture', 'mystery', 'engineering'],
        isActive: true,
      },
      {
        artifactId: 'monolithic-nandi',
        siteId: 'lepakshi-temple-andhra',
        name: 'Monolithic Nandi',
        type: ArtifactType.SCULPTURE,
        description: 'Largest monolithic Nandi bull in India, carved from single granite block',
        historicalContext: 'Carved in 16th century, measures 27 feet long and 15 feet high',
        culturalSignificance: 'One of the largest Nandi sculptures in the world',
        location: {
          floor: 'Ground',
          section: 'Temple Entrance',
          coordinates: {
            latitude: 13.8285,
            longitude: 77.6035,
          },
        },
        qrCode: 'LP-NANDI-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['nandi', 'sculpture', 'monolithic', 'largest'],
        isActive: true,
      },
      {
        artifactId: 'ceiling-paintings',
        siteId: 'lepakshi-temple-andhra',
        name: 'Vijayanagara Ceiling Paintings',
        type: ArtifactType.PAINTING,
        description: 'Exquisite frescoes depicting scenes from Ramayana, Mahabharata, and Puranas',
        historicalContext: 'Painted in 16th century using natural pigments',
        culturalSignificance: 'Best preserved examples of Vijayanagara mural art',
        location: {
          floor: 'Ground',
          section: 'Main Hall Ceiling',
          coordinates: {
            latitude: 13.8283,
            longitude: 77.6033,
          },
        },
        qrCode: 'LP-PAINT-003',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['paintings', 'frescoes', 'vijayanagara', 'art'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Halebidu
    const halebiduArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'hoysaleswara-temple',
        siteId: 'halebidu-temple-karnataka',
        name: 'Hoysaleswara Temple Main Structure',
        type: ArtifactType.TEMPLE,
        description: 'Twin-shrined temple with intricate soapstone carvings covering every inch',
        historicalContext: 'Built in 1121 CE, took 105 years to complete',
        culturalSignificance: 'Epitome of Hoysala architecture with 240 wall sculptures',
        location: {
          floor: 'Ground',
          section: 'Main Temple',
          coordinates: {
            latitude: 13.2172,
            longitude: 75.9961,
          },
        },
        qrCode: 'HB-TEMPLE-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['temple', 'hoysala', 'architecture', 'unesco'],
        isActive: true,
      },
      {
        artifactId: 'darpana-sundari',
        siteId: 'halebidu-temple-karnataka',
        name: 'Darpana Sundari Sculpture',
        type: ArtifactType.SCULPTURE,
        description: 'Famous sculpture of a lady with mirror, masterpiece of Hoysala art',
        historicalContext: 'Carved in 12th century, shows incredible detail and craftsmanship',
        culturalSignificance: 'Icon of Hoysala sculptural excellence, depicts beauty and grace',
        location: {
          floor: 'Ground',
          section: 'Outer Wall',
          coordinates: {
            latitude: 13.2172,
            longitude: 75.9962,
          },
        },
        qrCode: 'HB-SCULPT-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['sculpture', 'hoysala', 'art', 'iconic'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Belur
    const belurArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'chennakeshava-temple',
        siteId: 'belur-temple-karnataka',
        name: 'Chennakeshava Temple',
        type: ArtifactType.TEMPLE,
        description: 'Magnificent Vishnu temple with star-shaped platform and ornate pillars',
        historicalContext: 'Built in 1117 CE to commemorate Hoysala victory over Cholas',
        culturalSignificance: 'Masterpiece of Hoysala architecture, still an active place of worship',
        location: {
          floor: 'Ground',
          section: 'Main Temple',
          coordinates: {
            latitude: 13.1656,
            longitude: 75.8653,
          },
        },
        qrCode: 'BL-TEMPLE-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['temple', 'vishnu', 'hoysala', 'unesco'],
        isActive: true,
      },
      {
        artifactId: 'narasimha-pillar',
        siteId: 'belur-temple-karnataka',
        name: 'Narasimha Pillar',
        type: ArtifactType.SCULPTURE,
        description: 'Intricately carved rotating pillar, engineering marvel of 12th century',
        historicalContext: 'One of 48 pillars, could be rotated on its base',
        culturalSignificance: 'Demonstrates advanced engineering and sculptural skills',
        location: {
          floor: 'Ground',
          section: 'Main Hall',
          coordinates: {
            latitude: 13.1656,
            longitude: 75.8653,
          },
        },
        qrCode: 'BL-PILLAR-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['pillar', 'engineering', 'hoysala', 'rotating'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Thanjavur
    const thanjavurArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'big-temple-vimana',
        siteId: 'thanjavur-temple-tamilnadu',
        name: 'Brihadeeswarar Temple Vimana',
        type: ArtifactType.ARCHITECTURE,
        description: '216-foot tall pyramidal tower, one of the tallest in the world',
        historicalContext: 'Built in 1010 CE, capstone weighs 80 tons',
        culturalSignificance: 'Architectural marvel, shadow never falls on ground at noon',
        location: {
          floor: 'Ground',
          section: 'Main Temple',
          coordinates: {
            latitude: 10.7825,
            longitude: 79.1314,
          },
        },
        qrCode: 'TJ-VIMANA-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['vimana', 'architecture', 'chola', 'unesco'],
        isActive: true,
      },
      {
        artifactId: 'nandi-statue',
        siteId: 'thanjavur-temple-tamilnadu',
        name: 'Nandi Statue',
        type: ArtifactType.SCULPTURE,
        description: 'Massive monolithic Nandi bull, 16 feet long and 13 feet high',
        historicalContext: 'Carved from single stone in 11th century',
        culturalSignificance: 'Second largest Nandi in India, weighs approximately 25 tons',
        location: {
          floor: 'Ground',
          section: 'Temple Entrance',
          coordinates: {
            latitude: 10.7826,
            longitude: 79.1315,
          },
        },
        qrCode: 'TJ-NANDI-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['nandi', 'sculpture', 'chola', 'monolithic'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Ellora Caves
    const elloraArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'kailasa-temple',
        siteId: 'ellora-caves-maharashtra',
        name: 'Kailasa Temple (Cave 16)',
        type: ArtifactType.TEMPLE,
        description: 'Largest monolithic rock excavation in the world, carved top-down',
        historicalContext: 'Built in 8th century by Rashtrakuta king Krishna I',
        culturalSignificance: 'Represents Mount Kailash, home of Lord Shiva, architectural wonder',
        location: {
          floor: 'Ground',
          section: 'Cave 16',
          coordinates: {
            latitude: 20.0269,
            longitude: 75.1795,
          },
        },
        qrCode: 'EL-KAILASA-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['temple', 'monolithic', 'rock-cut', 'unesco'],
        isActive: true,
      },
      {
        artifactId: 'ravana-shaking-kailasa',
        siteId: 'ellora-caves-maharashtra',
        name: 'Ravana Shaking Mount Kailasa',
        type: ArtifactType.SCULPTURE,
        description: 'Dramatic sculpture showing Ravana lifting Mount Kailasa',
        historicalContext: 'Carved in 8th century, depicts scene from Ramayana',
        culturalSignificance: 'Masterpiece of Indian rock-cut sculpture',
        location: {
          floor: 'Ground',
          section: 'Cave 16 - Kailasa Temple',
          coordinates: {
            latitude: 20.0269,
            longitude: 75.1796,
          },
        },
        qrCode: 'EL-RAVANA-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['sculpture', 'ravana', 'mythology', 'rock-cut'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Meenakshi Temple
    const meenakshiArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'meenakshi-gopuram',
        siteId: 'meenakshi-temple-tamilnadu',
        name: 'South Gopuram',
        type: ArtifactType.ARCHITECTURE,
        description: 'Tallest gopuram at 170 feet with thousands of colorful sculptures',
        historicalContext: 'Built in 17th century by Nayak rulers',
        culturalSignificance: 'Iconic symbol of Madurai, visible from miles away',
        location: {
          floor: 'Ground',
          section: 'South Entrance',
          coordinates: {
            latitude: 9.9195,
            longitude: 78.1193,
          },
        },
        qrCode: 'MK-GOPURAM-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['gopuram', 'architecture', 'nayak', 'iconic'],
        isActive: true,
      },
      {
        artifactId: 'thousand-pillar-hall',
        siteId: 'meenakshi-temple-tamilnadu',
        name: 'Thousand Pillar Hall',
        type: ArtifactType.ARCHITECTURE,
        description: 'Magnificent hall with 985 intricately carved pillars',
        historicalContext: 'Built in 16th century, each pillar uniquely carved',
        culturalSignificance: 'Architectural marvel, now houses temple museum',
        location: {
          floor: 'Ground',
          section: 'East Side',
          coordinates: {
            latitude: 9.9196,
            longitude: 78.1194,
          },
        },
        qrCode: 'MK-HALL-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['hall', 'pillars', 'architecture', 'museum'],
        isActive: true,
      },
    ];

    // Seed Artifacts for Khajuraho
    const khajurahoArtifacts: Omit<ArtifactReference, 'createdAt' | 'updatedAt'>[] = [
      {
        artifactId: 'kandariya-mahadeva',
        siteId: 'khajuraho-temples-madhyapradesh',
        name: 'Kandariya Mahadeva Temple',
        type: ArtifactType.TEMPLE,
        description: 'Largest and most ornate temple with 900 sculptures',
        historicalContext: 'Built around 1050 CE by Chandela king Vidyadhara',
        culturalSignificance: 'Pinnacle of Chandela architecture, represents Mount Kailash',
        location: {
          floor: 'Ground',
          section: 'Western Group',
          coordinates: {
            latitude: 24.8318,
            longitude: 79.9199,
          },
        },
        qrCode: 'KH-TEMPLE-001',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['temple', 'chandela', 'architecture', 'unesco'],
        isActive: true,
      },
      {
        artifactId: 'erotic-sculptures',
        siteId: 'khajuraho-temples-madhyapradesh',
        name: 'Mithuna Sculptures',
        type: ArtifactType.SCULPTURE,
        description: 'Famous erotic sculptures depicting various aspects of life and love',
        historicalContext: 'Carved in 10th-11th century, represent tantric traditions',
        culturalSignificance: 'Celebrate human emotions, only 10% of total sculptures are erotic',
        location: {
          floor: 'Ground',
          section: 'Temple Walls',
          coordinates: {
            latitude: 24.8319,
            longitude: 79.9200,
          },
        },
        qrCode: 'KH-SCULPT-002',
        images: [],
        audioGuides: [],
        videos: [],
        infographics: [],
        tags: ['sculpture', 'erotic', 'art', 'tantric'],
        isActive: true,
      },
    ];

    const allArtifacts = [
      ...lepakshiArtifacts,
      ...tirupatiArtifacts,
      ...kalahastArtifacts,
      ...srisailamArtifacts,
      ...vidurashwathaArtifacts,
      ...hampiArtifacts,
      ...halebiduArtifacts,
      ...belurArtifacts,
      ...thanjavurArtifacts,
      ...elloraArtifacts,
      ...meenakshiArtifacts,
      ...khajurahoArtifacts,
    ];

    for (const artifact of allArtifacts) {
      const result = await artifactsRepo.create(artifact);
      if (result) {
        console.log(`✅ Created artifact: ${artifact.name} (${artifact.artifactId})`);
      } else {
        console.log(`⚠️  Failed to create artifact: ${artifact.name}`);
      }
    }

    console.log('\n✨ Data seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Heritage Sites: ${sites.length}`);
    console.log(`   - Artifacts: ${allArtifacts.length}`);
    console.log(`\n🕉️  Hindu Temples Added:`);
    console.log(`   1. Lepakshi Temple (Andhra Pradesh) - 3 artifacts`);
    console.log(`   2. Tirumala Venkateswara Temple/TTD (Andhra Pradesh) - 2 artifacts`);
    console.log(`   3. Sri Kalahasti Temple (Andhra Pradesh) - 2 artifacts`);
    console.log(`   4. Sri Bhramaramba Mallikarjuna Temple, Srisailam (Andhra Pradesh) - 2 artifacts`);
    console.log(`   5. Vidurashwatha Temple (Karnataka) - 2 artifacts`);
    console.log(`   6. Hampi Ruins (Karnataka) - 2 artifacts`);
    console.log(`   7. Halebidu Hoysaleswara Temple (Karnataka) - 2 artifacts`);
    console.log(`   8. Belur Chennakeshava Temple (Karnataka) - 2 artifacts`);
    console.log(`   9. Brihadeeswarar Temple (Tamil Nadu) - 2 artifacts`);
    console.log(`   10. Ellora Caves (Maharashtra) - 2 artifacts`);
    console.log(`   11. Meenakshi Amman Temple (Tamil Nadu) - 2 artifacts`);
    console.log(`   12. Khajuraho Temples (Madhya Pradesh) - 2 artifacts`);
    console.log(`\n🎉 Your AvvarI backend is now ready with comprehensive Hindu temple data!`);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed script
seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
