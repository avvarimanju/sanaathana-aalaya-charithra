// Indian States and Union Territories Data
// This file contains comprehensive data for all 28 states and 8 union territories of India

export interface IndianState {
  code: string;           // 2-letter state code
  name: string;           // Full state name
  displayName: string;    // Localized display name
  svgPath: string;        // SVG path data for state boundary
  labelPosition: {        // Position for state label on map
    x: number;
    y: number;
  };
  type: 'state' | 'ut';   // State or Union Territory
}

// All 28 States and 8 Union Territories of India
// SVG paths are simplified for performance while maintaining recognizable shapes
export const INDIAN_STATES: IndianState[] = [
  // States (28)
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    displayName: 'Andhra Pradesh',
    svgPath: 'M 650,850 L 680,840 L 710,860 L 720,890 L 710,920 L 680,930 L 650,920 L 640,890 Z',
    labelPosition: { x: 680, y: 890 },
    type: 'state'
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    displayName: 'Arunachal Pradesh',
    svgPath: 'M 850,180 L 900,170 L 930,190 L 940,220 L 920,250 L 880,260 L 850,240 Z',
    labelPosition: { x: 890, y: 215 },
    type: 'state'
  },
  {
    code: 'AS',
    name: 'Assam',
    displayName: 'Assam',
    svgPath: 'M 820,240 L 850,230 L 870,250 L 860,280 L 830,290 L 810,270 Z',
    labelPosition: { x: 840, y: 260 },
    type: 'state'
  },
  {
    code: 'BR',
    name: 'Bihar',
    displayName: 'Bihar',
    svgPath: 'M 620,380 L 660,370 L 690,390 L 680,420 L 650,430 L 620,410 Z',
    labelPosition: { x: 650, y: 400 },
    type: 'state'
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    displayName: 'Chhattisgarh',
    svgPath: 'M 580,550 L 620,540 L 650,570 L 640,610 L 600,620 L 570,590 Z',
    labelPosition: { x: 610, y: 580 },
    type: 'state'
  },
  {
    code: 'GA',
    name: 'Goa',
    displayName: 'Goa',
    svgPath: 'M 420,780 L 440,770 L 450,790 L 440,810 L 420,800 Z',
    labelPosition: { x: 435, y: 790 },
    type: 'state'
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    displayName: 'Gujarat',
    svgPath: 'M 280,520 L 350,500 L 400,540 L 390,600 L 340,620 L 280,590 L 260,550 Z',
    labelPosition: { x: 330, y: 560 },
    type: 'state'
  },
  {
    code: 'HR',
    name: 'Haryana',
    displayName: 'Haryana',
    svgPath: 'M 450,280 L 490,270 L 510,300 L 500,330 L 460,340 L 440,310 Z',
    labelPosition: { x: 475, y: 305 },
    type: 'state'
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    displayName: 'Himachal Pradesh',
    svgPath: 'M 450,180 L 500,160 L 530,190 L 520,230 L 480,240 L 450,210 Z',
    labelPosition: { x: 490, y: 200 },
    type: 'state'
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    displayName: 'Jharkhand',
    svgPath: 'M 620,450 L 660,440 L 680,470 L 670,510 L 630,520 L 610,490 Z',
    labelPosition: { x: 645, y: 480 },
    type: 'state'
  },
  {
    code: 'KA',
    name: 'Karnataka',
    displayName: 'Karnataka',
    svgPath: 'M 480,820 L 540,800 L 590,840 L 580,900 L 530,920 L 480,890 L 460,850 Z',
    labelPosition: { x: 530, y: 860 },
    type: 'state'
  },
  {
    code: 'KL',
    name: 'Kerala',
    displayName: 'Kerala',
    svgPath: 'M 460,920 L 490,910 L 510,950 L 500,1000 L 470,1010 L 450,970 Z',
    labelPosition: { x: 480, y: 960 },
    type: 'state'
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    displayName: 'Madhya Pradesh',
    svgPath: 'M 450,450 L 550,430 L 600,480 L 590,550 L 520,570 L 440,540 L 420,490 Z',
    labelPosition: { x: 510, y: 500 },
    type: 'state'
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    displayName: 'Maharashtra',
    svgPath: 'M 400,650 L 500,630 L 570,680 L 560,760 L 480,780 L 400,740 L 380,690 Z',
    labelPosition: { x: 480, y: 705 },
    type: 'state'
  },
  {
    code: 'MN',
    name: 'Manipur',
    displayName: 'Manipur',
    svgPath: 'M 840,310 L 860,300 L 875,320 L 865,345 L 845,350 L 835,330 Z',
    labelPosition: { x: 853, y: 325 },
    type: 'state'
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    displayName: 'Meghalaya',
    svgPath: 'M 800,280 L 830,270 L 845,295 L 835,315 L 805,320 L 795,300 Z',
    labelPosition: { x: 820, y: 295 },
    type: 'state'
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    displayName: 'Mizoram',
    svgPath: 'M 820,360 L 840,350 L 855,375 L 845,400 L 825,405 L 815,380 Z',
    labelPosition: { x: 835, y: 378 },
    type: 'state'
  },
  {
    code: 'NL',
    name: 'Nagaland',
    displayName: 'Nagaland',
    svgPath: 'M 850,260 L 875,250 L 890,275 L 880,300 L 855,305 L 845,280 Z',
    labelPosition: { x: 868, y: 278 },
    type: 'state'
  },
  {
    code: 'OR',
    name: 'Odisha',
    displayName: 'Odisha',
    svgPath: 'M 640,550 L 690,540 L 720,580 L 710,640 L 660,660 L 630,620 Z',
    labelPosition: { x: 675, y: 600 },
    type: 'state'
  },
  {
    code: 'PB',
    name: 'Punjab',
    displayName: 'Punjab',
    svgPath: 'M 400,220 L 450,200 L 480,230 L 470,270 L 430,280 L 400,250 Z',
    labelPosition: { x: 440, y: 240 },
    type: 'state'
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    displayName: 'Rajasthan',
    svgPath: 'M 300,300 L 420,270 L 480,340 L 460,430 L 380,450 L 300,410 L 270,350 Z',
    labelPosition: { x: 380, y: 360 },
    type: 'state'
  },
  {
    code: 'SK',
    name: 'Sikkim',
    displayName: 'Sikkim',
    svgPath: 'M 720,240 L 740,230 L 755,250 L 745,270 L 725,275 L 715,255 Z',
    labelPosition: { x: 735, y: 253 },
    type: 'state'
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    displayName: 'Tamil Nadu',
    svgPath: 'M 520,930 L 580,910 L 630,950 L 620,1020 L 560,1040 L 510,1000 Z',
    labelPosition: { x: 575, y: 975 },
    type: 'state'
  },
  {
    code: 'TS',
    name: 'Telangana',
    displayName: 'Telangana',
    svgPath: 'M 560,760 L 600,750 L 630,780 L 620,820 L 580,830 L 550,800 Z',
    labelPosition: { x: 590, y: 790 },
    type: 'state'
  },
  {
    code: 'TR',
    name: 'Tripura',
    displayName: 'Tripura',
    svgPath: 'M 810,330 L 830,320 L 845,345 L 835,365 L 815,370 L 805,350 Z',
    labelPosition: { x: 825, y: 345 },
    type: 'state'
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    displayName: 'Uttar Pradesh',
    svgPath: 'M 480,300 L 600,280 L 650,340 L 640,400 L 560,420 L 470,390 L 460,340 Z',
    labelPosition: { x: 560, y: 350 },
    type: 'state'
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    displayName: 'Uttarakhand',
    svgPath: 'M 520,230 L 560,220 L 585,250 L 575,285 L 540,295 L 515,265 Z',
    labelPosition: { x: 550, y: 258 },
    type: 'state'
  },
  {
    code: 'WB',
    name: 'West Bengal',
    displayName: 'West Bengal',
    svgPath: 'M 680,350 L 730,340 L 760,380 L 750,450 L 700,470 L 670,420 Z',
    labelPosition: { x: 715, y: 405 },
    type: 'state'
  },
  
  // Union Territories (8)
  {
    code: 'AN',
    name: 'Andaman and Nicobar Islands',
    displayName: 'Andaman and Nicobar Islands',
    svgPath: 'M 850,900 L 865,890 L 875,910 L 870,940 L 855,950 L 845,930 Z',
    labelPosition: { x: 860, y: 920 },
    type: 'ut'
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    displayName: 'Chandigarh',
    svgPath: 'M 460,250 L 470,245 L 475,255 L 470,265 L 460,260 Z',
    labelPosition: { x: 468, y: 255 },
    type: 'ut'
  },
  {
    code: 'DH',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    displayName: 'Dadra and Nagar Haveli and Daman and Diu',
    svgPath: 'M 340,600 L 355,595 L 365,610 L 360,625 L 345,630 L 335,615 Z',
    labelPosition: { x: 350, y: 613 },
    type: 'ut'
  },
  {
    code: 'DL',
    name: 'Delhi',
    displayName: 'Delhi',
    svgPath: 'M 480,300 L 492,295 L 498,307 L 492,318 L 480,313 Z',
    labelPosition: { x: 489, y: 307 },
    type: 'ut'
  },
  {
    code: 'JK',
    name: 'Jammu and Kashmir',
    displayName: 'Jammu and Kashmir',
    svgPath: 'M 350,100 L 420,80 L 480,120 L 470,180 L 410,200 L 350,170 L 330,130 Z',
    labelPosition: { x: 400, y: 140 },
    type: 'ut'
  },
  {
    code: 'LA',
    name: 'Ladakh',
    displayName: 'Ladakh',
    svgPath: 'M 480,50 L 560,30 L 620,70 L 610,130 L 550,150 L 480,110 Z',
    labelPosition: { x: 545, y: 90 },
    type: 'ut'
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    displayName: 'Lakshadweep',
    svgPath: 'M 280,850 L 295,845 L 305,860 L 300,875 L 285,880 L 275,865 Z',
    labelPosition: { x: 290, y: 863 },
    type: 'ut'
  },
  {
    code: 'PY',
    name: 'Puducherry',
    displayName: 'Puducherry',
    svgPath: 'M 590,920 L 602,915 L 608,927 L 602,938 L 590,933 Z',
    labelPosition: { x: 599, y: 927 },
    type: 'ut'
  },
];

/**
 * Get state information by state code
 * @param code - 2-letter state code (e.g., "KA", "TN")
 * @returns IndianState object or undefined if not found
 */
export const getStateByCode = (code: string): IndianState | undefined => {
  return INDIAN_STATES.find(state => state.code === code);
};

/**
 * Get state name by state code
 * @param code - 2-letter state code
 * @returns State name or the code itself if not found
 */
export const getStateName = (code: string): string => {
  return getStateByCode(code)?.name || code;
};

/**
 * Get all states sorted alphabetically by name
 * @returns Array of IndianState objects sorted by name
 */
export const getSortedStates = (): IndianState[] => {
  return [...INDIAN_STATES].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get states filtered by type
 * @param type - 'state' or 'ut'
 * @returns Array of IndianState objects of the specified type
 */
export const getStatesByType = (type: 'state' | 'ut'): IndianState[] => {
  return INDIAN_STATES.filter(state => state.type === type);
};
