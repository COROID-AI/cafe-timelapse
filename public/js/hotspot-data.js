// Hotspot data for each era
// Defines interactive objects in the café scene with period-specific information

/**
 * Hotspot data structure:
 * {
 *   era: number, // Year (1945, 1965, 1985, 2005, 2025)
 *   name: string, // Identifier for the hotspot
 *   position: { x: number, y: number, z: number }, // 3D position in scene
 *   info: {
 *     title: string, // Title shown in inspector
 *     description: string // Detailed information shown in inspector
 *   }
 * }
 */

export const hotspotData = {
  1945: [
    {
      era: 1945,
      name: 'manual-percolator',
      position: { x: -1.2, y: 0, z: 1.5 },
      info: {
        title: 'Manual Percolator (1945)',
        description:
          'This manual percolator was the heart of the café in 1945. Water is heated in the lower chamber, forcing boiling water up through a tube into an upper chamber where it percolates through coffee grounds. The process repeats until the desired strength is achieved. Typical brewing time: 5-10 minutes.'
      }
    },
    {
      era: 1945,
      name: 'wwii-poster',
      position: { x: 2.0, y: 1.5, z: -2.0 },
      info: {
        title: 'WWII Propaganda Poster',
        description:
          'This 1943 poster encourages civilians to buy war bonds to support the troops. The slogan "Buy War Bonds" was common during World War II as a way to finance the war effort. The artwork features patriotic imagery and colors.'
      }
    },
    {
      era: 1945,
      name: 'wooden-chair',
      position: { x: -0.5, y: 0, z: -1.0 },
      info: {
        title: 'Solid Wood Chair',
        description:
          'This chair is made from solid oak, typical of 1940s furniture. The wood is stained dark and polished to a shine. The simple, sturdy design reflects the wartime emphasis on durability and practicality.'
      }
    }
  ],

  1965: [
    {
      era: 1965,
      name: 'jukebox',
      position: { x: -2.0, y: 0.5, z: 1.0 },
      info: {
        title: 'Wurlitzer Jukebox (1965)',
        description:
          'This classic Wurlitzer jukebox plays 45 RPM records. Popular songs of 1965 include "(I Can\'t Get No) Satisfaction" by The Rolling Stones, "Help!" by The Beatles, and "Respect" by Otis Redding. Customers could select songs by entering the letter and number combination.'
      }
    },
    {
      era: 1965,
      name: 'formica-counter',
      position: { x: 0, y: 0, z: 2.0 },
      info: {
        title: 'Formica Countertop',
        description:
          'The countertop is made of Formica, a popular laminate material in the 1960s. This particular pattern features a boomerang pattern in avocado green and cream, typical of mid-century modern design. Formica was valued for its durability and easy-to-clean surface.'
      }
    },
    {
      era: 1965,
      name: 'beatles-poster',
      position: { x: 2.5, y: 1.8, z: -1.5 },
      info: {
        title: "Beatles Concert Poster",
        description:
          "This poster advertises The Beatles' 1965 North American tour. The band had just released \"Help!\" and were at the peak of their fame. The psychedelic art style reflects the growing influence of the counterculture movement."
      }
    }
  ],

  1985: [
    {
      era: 1985,
      name: 'boombox',
      position: { x: -1.8, y: 0.5, z: 1.2 },
      info: {
        title: 'Boombox (1985)',
        description:
          'This portable cassette player was a cultural icon of the 1980s. It played both cassette tapes and FM radio, often with powerful speakers and a graphic equalizer. Popular music in 1985 included "Careless Whisper" by Wham!, "Money for Nothing" by Dire Straits, and "We Are the World" by USA for Africa.'
      }
    },
    {
      era: 1985,
      name: 'digital-register',
      position: { x: 0.5, y: 0, z: 2.2 },
      info: {
        title: 'Digital Cash Register',
        description:
          'This electronic cash register from the mid-1980s features a digital display and thermal printer for receipts. It represents the transition from mechanical to electronic point-of-sale systems, allowing for faster transactions and better sales tracking.'
      }
    },
    {
      era: 1985,
      name: 'geometric-wallpaper',
      position: { x: 2.2, y: 1.0, z: -1.8 },
      info: {
        title: 'Geometric Wallpaper',
        description:
          'This bold geometric pattern in mauve and teal was typical of 1980s interior design. The Memphis Design movement, founded in 1981, influenced many interiors with its use of bold colors, geometric shapes, and playful patterns.'
      }
    }
  ],

  2005: [
    {
      era: 2005,
      name: 'ipod-dock',
      position: { x: -1.5, y: 0.5, z: 1.0 },
      info: {
        title: 'iPod Docking Station',
        description:
          'This docking station for Apple iPods became popular after the iPod\'s 2001 launch. By 2005, iPods had sold over 22 million units worldwide. The dock charges the iPod and plays its music through external speakers. Popular songs of 2005 included "Hollaback Girl" by Gwen Stefani and "Gold Digger" by Kanye West.'
      }
    },
    {
      era: 2005,
      name: 'espresso-machine',
      position: { x: 0.8, y: 0, z: 2.0 },
      info: {
        title: 'Espresso Machine',
        description:
          'This semi-automatic espresso machine uses pressurized water to extract espresso from finely ground coffee beans. It features a milk frother for cappuccinos and lattes. The early 2000s saw a rise in specialty coffee culture, with consumers becoming more knowledgeable about espresso-based drinks.'
      }
    },
    {
      era: 2005,
      name: 'wifi-decal',
      position: { x: 2.0, y: 1.5, z: -1.2 },
      info: {
        title: 'Wi-Fi Available Decal',
        description:
          'This decal indicates that the café offers free Wi-Fi to customers. Wi-Fi technology became widely available in public spaces in the early 2000s. The Wi-Fi Alliance was formed in 1999 to promote wireless LAN technology and ensure interoperability between devices.'
      }
    }
  ],

  2025: [
    {
      era: 2025,
      name: 'smart-machine',
      position: { x: -1.2, y: 0.2, z: 1.8 },
      info: {
        title: 'Smart Coffee Machine',
        description:
          'This IoT-enabled coffee machine can be controlled via smartphone app, remembers user preferences, and automatically orders supplies when running low. It features precision temperature control and brewing profiles for different coffee types. The machine also tracks maintenance needs and can self-diagnose issues.'
      }
    },
    {
      era: 2025,
      name: 'contactless-payment',
      position: { x: 0.6, y: 0, z: 2.1 },
      info: {
        title: 'Contactless Payment Terminal',
        description:
          'This modern payment terminal accepts contactless payments via credit/debit cards, smartphones, and wearable devices using NFC (Near Field Communication) technology. It also supports QR code payments and mobile wallets like Apple Pay and Google Pay.'
      }
    },
    {
      era: 2025,
      name: 'sustainable-sign',
      position: { x: 2.3, y: 1.6, z: -1.0 },
      info: {
        title: 'Sustainability Signage',
        description:
          'This sign indicates the café\'s commitment to sustainability. It highlights practices such as compostable packaging, fair-trade coffee sourcing, energy-efficient appliances, and waste reduction programs. Many cafés in 2025 display their carbon footprint and sustainability certifications prominently.'
      }
    }
  ]
};

// Helper function to get hotspots for a specific era
export function getHotspotsForEra(era) {
  return hotspotData[era] || [];
}

// Helper function to get all eras with hotspots
export function getAllEras() {
  return Object.keys(hotspotData).map(Number).sort((a, b) => a - b);
}
