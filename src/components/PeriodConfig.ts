import { Color } from 'three';

export type Period = 1945 | 1965 | 1985 | 2005 | 2025 | 2055;

export interface PeriodConfig {
  period: Period;
  lighting: {
    ambientColor: string;
    ambientIntensity: number;
    directionalColor: string;
    directionalIntensity: number;
    fillColor: string;
  };
  furniture: {
    boothMaterial: string;
    tableMaterial: string;
    chairColor: string;
    boothStyle: 'wooden' | 'plastic' | 'metal' | 'smart';
    tableStyle: 'wooden' | 'formica' | 'glass' | 'holographic';
  };
  coffeeEquipment: {
    type: 'manual-espresso' | 'drip' | 'moka' | 'automatic' | 'smart' | 'automated';
    material: string;
    color: string;
    hasDigitalDisplay: boolean;
    hasSmartFeatures: boolean;
  };
  menu: {
    items: Array<{ name: string; price: string; description?: string }>;
    backgroundColor: string;
    textColor: string;
    fontStyle: string;
  };
  patrons: {
    outfits: string[];
    hairstyles: string[];
    gadgets: string[];
  };
  decor: {
    posters: string[];
    lightingType: 'incandescent' | 'fluorescent' | 'neon' | 'led' | 'holographic';
    advertisements: string[];
  };
  counter: {
    technology: 'manual' | 'electronic' | 'contactless' | 'biometric';
    material: string;
    color: string;
  };
  tableware: {
    cupMaterial: 'porcelain' | 'melamine' | 'ceramic' | 'bioplastic';
    cupStyle: 'vintage' | 'modern' | 'minimal' | 'futuristic';
    saucerMaterial: string;
    napkinMaterial: 'paper' | 'cloth' | 'bioplastic';
  };
  audio: {
    music: string;
    conversation: string;
    equipment: string;
    musicVolume: number;
    conversationVolume: number;
    equipmentVolume: number;
  };
}

export const PERIOD_CONFIGS: Record<Period, PeriodConfig> = {
  1945: {
    period: 1945,
    lighting: {
      ambientColor: '#fff8e6',
      ambientIntensity: 0.6,
      directionalColor: '#ffd4a3',
      directionalIntensity: 0.8,
      fillColor: '#ffecd1',
    },
    furniture: {
      boothMaterial: '#8b4513', // Saddle brown wood
      tableMaterial: '#a0522d', // Sienna wood
      chairColor: '#654321', // Dark wood
      boothStyle: 'wooden',
      tableStyle: 'wooden',
    },
    coffeeEquipment: {
      type: 'manual-espresso',
      material: 'chrome',
      color: '#c0c0c0',
      hasDigitalDisplay: false,
      hasSmartFeatures: false,
    },
    menu: {
      items: [
        { name: 'Coffee', price: '5¢', description: 'Fresh brewed' },
        { name: 'Tea', price: '3¢' },
        { name: 'Sandwich', price: '15¢' },
        { name: 'Pie', price: '10¢' },
      ],
      backgroundColor: '#f5deb3',
      textColor: '#4b2e2e',
      fontStyle: 'vintage',
    },
    patrons: {
      outfits: ['suit', 'dress', 'overalls', 'military'],
      hairstyles: ['victory-rolls', 'pompadour', 'slick-back', 'victory-hair'],
      gadgets: [],
    },
    decor: {
      posters: ['war-bonds', 'victory-garden', 'rationing-notice'],
      lightingType: 'incandescent',
      advertisements: ['coca-cola-classic', 'cigarettes'],
    },
    counter: {
      technology: 'manual',
      material: 'wood',
      color: '#8b4513',
    },
    tableware: {
      cupMaterial: 'porcelain',
      cupStyle: 'vintage',
      saucerMaterial: '#ffffff',
      napkinMaterial: 'cloth',
    },
    audio: {
      music: 'big-band-radio',
      conversation: 'murmur-1945',
      equipment: 'espresso-steam-1945',
      musicVolume: 0.3,
      conversationVolume: 0.4,
      equipmentVolume: 0.5,
    },
  },
  1965: {
    period: 1965,
    lighting: {
      ambientColor: '#fef3ff',
      ambientIntensity: 0.7,
      directionalColor: '#ffb3e6',
      directionalIntensity: 0.9,
      fillColor: '#ffd9f0',
    },
    furniture: {
      boothMaterial: '#ff69b4', // Hot pink plastic
      tableMaterial: '#9370db', // Medium purple formica
      chairColor: '#00ced1', // Dark turquoise
      boothStyle: 'plastic',
      tableStyle: 'formica',
    },
    coffeeEquipment: {
      type: 'drip',
      material: 'aluminum',
      color: '#daa520',
      hasDigitalDisplay: false,
      hasSmartFeatures: false,
    },
    menu: {
      items: [
        { name: 'Espresso', price: '25¢', description: 'Strong and bold' },
        { name: 'Cappuccino', price: '35¢' },
        { name: 'Donut', price: '15¢' },
        { name: 'New York Cheesecake', price: '45¢' },
      ],
      backgroundColor: '#ffebf0',
      textColor: '#4a004e',
      fontStyle: 'modern',
    },
    patrons: {
      outfits: ['mini-skirt', 'bell-bottoms', 'turtle-neck', 'peace-sign-tshirt', 'hippie-dress'],
      hairstyles: ['beehive', 'long-hair', 'pixie-cut', 'afro'],
      gadgets: [],
    },
    decor: {
      posters: ['beatles', 'rolling-stones', 'peace-symbol', 'woodstock'],
      lightingType: 'incandescent',
      advertisements: ['coca-cola', 'marlboro'],
    },
    counter: {
      technology: 'manual',
      material: 'formica',
      color: '#ff69b4',
    },
    tableware: {
      cupMaterial: 'ceramic',
      cupStyle: 'modern',
      saucerMaterial: '#ffffff',
      napkinMaterial: 'paper',
    },
    audio: {
      music: 'folk-rock-radio',
      conversation: 'murmur-1965',
      equipment: 'drip-pour-1965',
      musicVolume: 0.4,
      conversationVolume: 0.3,
      equipmentVolume: 0.4,
    },
  },
  1985: {
    period: 1985,
    lighting: {
      ambientColor: '#1a1a1a',
      ambientIntensity: 0.5,
      directionalColor: '#ff00ff',
      directionalIntensity: 0.6,
      fillColor: '#00ffff',
    },
    furniture: {
      boothMaterial: '#ff00ff', // Neon pink
      tableMaterial: '#00ffff', // Cyan
      chairColor: '#ffff00', // Yellow
      boothStyle: 'plastic',
      tableStyle: 'formica',
    },
    coffeeEquipment: {
      type: 'moka',
      material: 'aluminum',
      color: '#c0c0c0',
      hasDigitalDisplay: false,
      hasSmartFeatures: false,
    },
    menu: {
      items: [
        { name: 'Espresso', price: '$1.50', description: 'Strong Italian' },
        { name: 'Cappuccino', price: '$2.00' },
        { name: 'Croissant', price: '$1.25' },
        { name: 'Bagel', price: '$0.95' },
      ],
      backgroundColor: '#000000',
      textColor: '#0fff0f',
      fontStyle: 'modern',
    },
    patrons: {
      outfits: ['leather-jacket', 'punk-shirt', 'jeans', 'leg-warmers', ' Members Only jacket'],
      hairstyles: ['mohawk', 'spiky-hair', 'big-hair', 'flat-top'],
      gadgets: [],
    },
    decor: {
      posters: ['mtv', 'madonna', 'pac-man', 'back-to-the-future'],
      lightingType: 'neon',
      advertisements: ['pepsi', 'new-coke'],
    },
    counter: {
      technology: 'electronic',
      material: 'metal',
      color: '#c0c0c0',
    },
    tableware: {
      cupMaterial: 'ceramic',
      cupStyle: 'modern',
      saucerMaterial: '#ffffff',
      napkinMaterial: 'paper',
    },
    audio: {
      music: 'jukebox-80s',
      conversation: 'murmur-1985',
      equipment: 'moka-whistle-1985',
      musicVolume: 0.6,
      conversationVolume: 0.3,
      equipmentVolume: 0.5,
    },
  },
  2005: {
    period: 2005,
    lighting: {
      ambientColor: '#f0f0f0',
      ambientIntensity: 0.8,
      directionalColor: '#ffffff',
      directionalIntensity: 1.0,
      fillColor: '#e0e0e0',
    },
    furniture: {
      boothMaterial: '#2f4f4f', // Dark slate gray
      tableMaterial: '#c0c0c0', // Silver
      chairColor: '#708090', // Slate gray
      boothStyle: 'metal',
      tableStyle: 'glass',
    },
    coffeeEquipment: {
      type: 'automatic',
      material: 'stainless-steel',
      color: '#c0c0c0',
      hasDigitalDisplay: true,
      hasSmartFeatures: false,
    },
    menu: {
      items: [
        { name: 'Latte', price: '$3.50', description: 'Steamed milk' },
        { name: 'Cappuccino', price: '$3.00' },
        { name: 'Mocha', price: '$4.25' },
        { name: 'Cinnamon Roll', price: '$2.50' },
      ],
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontStyle: 'modern',
    },
    patrons: {
      outfits: ['hoodie', 'business-casual', 'jeans', 'polo-shirt', 'cargo-pants'],
      hairstyles: ['spiky', 'straight', 'curtains', 'buzz-cut'],
      gadgets: [],
    },
    decor: {
      posters: ['ipod', 'star-wars-previous', 'friends-tv'],
      lightingType: 'fluorescent',
      advertisements: ['starbucks', 'ipod'],
    },
    counter: {
      technology: 'electronic',
      material: 'plastic',
      color: '#ffffff',
    },
    tableware: {
      cupMaterial: 'ceramic',
      cupStyle: 'minimal',
      saucerMaterial: '#ffffff',
      napkinMaterial: 'paper',
    },
    audio: {
      music: 'ipod-playlist',
      conversation: 'murmur-2005',
      equipment: 'automatic-hum-2005',
      musicVolume: 0.5,
      conversationVolume: 0.4,
      equipmentVolume: 0.4,
    },
  },
  2025: {
    period: 2025,
    lighting: {
      ambientColor: '#e0f7ff',
      ambientIntensity: 0.7,
      directionalColor: '#0ea5e9',
      directionalIntensity: 0.9,
      fillColor: '#bae6fd',
    },
    furniture: {
      boothMaterial: '#38bdf8', // Modern blue
      tableMaterial: '#e0f2fe', // Light steel blue
      chairColor: '#0ea5e9', // Ocean blue
      boothStyle: 'metal',
      tableStyle: 'glass',
    },
    coffeeEquipment: {
      type: 'smart',
      material: 'matte-black',
      color: '#1e293b',
      hasDigitalDisplay: true,
      hasSmartFeatures: true,
    },
    menu: {
      items: [
        { name: 'Cold Brew', price: '$5.50', description: '24hr steeped' },
        { name: 'Nitro Coffee', price: '$6.00' },
        { name: 'Avocado Toast', price: '$8.50' },
        { name: 'Artisan Pastry', price: '$4.50' },
      ],
      backgroundColor: '#ffffff',
      textColor: '#0c4a6e',
      fontStyle: 'modern',
    },
    patrons: {
      outfits: ['athleisure', 'casual-polo', 'jeans', 'light-jacket', 'sneakers'],
      hairstyles: ['casual', 'undercut', 'man-bun', 'lob'],
      gadgets: ['smartphone', 'tablet', 'laptop', 'wireless-charger'],
    },
    decor: {
      posters: ['instagram', 'climate-awareness', 'wifi-symbol', 'plant-based'],
      lightingType: 'led',
      advertisements: ['starbucks-modern', 'oat-milk'],
    },
    counter: {
      technology: 'contactless',
      material: 'glass',
      color: '#e0f2fe',
    },
    tableware: {
      cupMaterial: 'ceramic',
      cupStyle: 'modern',
      saucerMaterial: '#ffffff',
      napkinMaterial: 'paper',
    },
    audio: {
      music: 'streaming-playlist',
      conversation: 'murmur-2025',
      equipment: 'smart-brew-2025',
      musicVolume: 0.5,
      conversationVolume: 0.3,
      equipmentVolume: 0.4,
    },
  },
  2055: {
    period: 2055,
    lighting: {
      ambientColor: '#f5feff',
      ambientIntensity: 0.8,
      directionalColor: '#22d3ee',
      directionalIntensity: 1.0,
      fillColor: '#ccfbff',
    },
    furniture: {
      boothMaterial: '#22d3ee', // Holographic cyan
      tableMaterial: '#67e8f9', // Bright cyan
      chairColor: '#22d3ee', // Cyan
      boothStyle: 'smart',
      tableStyle: 'holographic',
    },
    coffeeEquipment: {
      type: 'automated',
      material: 'chrome',
      color: '#22d3ee',
      hasDigitalDisplay: true,
      hasSmartFeatures: true,
    },
    menu: {
      items: [
        { name: 'Nano Roast', price: '0.002 ETH', description: 'Lab-grown beans' },
        { name: 'Quantum Cold Brew', price: '0.003 ETH' },
        { name: 'Lab-Grown Muffin', price: '0.001 ETH' },
        { name: 'Synthetic Croissant', price: '0.0015 ETH' },
      ],
      backgroundColor: '#0891b2',
      textColor: '#ccfbff',
      fontStyle: 'futuristic',
    },
    patrons: {
      outfits: ['smart-fabric', 'led-clothing', 'tech-wear', 'holographic-accessory'],
      hairstyles: ['neon-dye', 'tech-braided', 'chrome-implants', 'holographic-extensions'],
      gadgets: ['ar-glasses', 'neural-implant', 'holo-tablet', 'levitating-phone'],
    },
    decor: {
      posters: ['crypto-coffee', 'mars-colony', 'ai-art', 'climate-restored'],
      lightingType: 'holographic',
      advertisements: ['neuralink', 'space-x-cafe'],
    },
    counter: {
      technology: 'biometric',
      material: 'chrome',
      color: '#22d3ee',
    },
    tableware: {
      cupMaterial: 'bioplastic',
      cupStyle: 'futuristic',
      saucerMaterial: '#67e8f9',
      napkinMaterial: 'bioplastic',
    },
    audio: {
      music: 'ai-generated',
      conversation: 'murmur-2055',
      equipment: 'automated-hum-2055',
      musicVolume: 0.4,
      conversationVolume: 0.3,
      equipmentVolume: 0.3,
    },
  },
};

export const PERIODS: Period[] = [1945, 1965, 1985, 2005, 2025, 2055];

export function getPeriodForIndex(index: number): Period {
  return PERIODS[index] || 1945;
}

export function getPeriodIndex(period: Period): number {
  return PERIODS.indexOf(period);
}