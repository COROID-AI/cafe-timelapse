// Hotspot data for each era
const hotspotData = {
  "1945": [
    {
      name: "coffeeMachine",
      description: "1940s Lever-action espresso machine: A gleaming chrome La Marzocco machine that served as the café's centerpiece, introducing espresso to the neighborhood.",
      era: "1945"
    },
    {
      name: "menuBoard",
      description: "Hand-painted menu board showing daily specials: Meatloaf sandwich (35 cents), coffee (10 cents), and pie slice (15 cents). Prices reflect post-war economy.",
      era: "1945"
    },
    {
      name: "jukebox",
      description: "Wurlitzer 850 Peacock jukebox: Playing big band hits from Glenn Miller and Benny Goodman, this was the social hub where teenagers gathered after school.",
      era: "1945"
    },
    {
      name: "poster1",
      description: "War bond poster: 'Buy War Bonds - Every Dollar a Bullet' featuring Rosie the Riveter, reflecting the homefront war effort during WWII.",
      era: "1945"
    },
    {
      name: "counter",
      description: "Art deco checkout counter: Made of polished walnut with chrome edges, featuring a manual cash register that required skilled operators to make change.",
      era: "1945"
    },
    {
      name: "patron1",
      description: "War veteran in uniform: Recently returned from overseas, adjusting to civilian life while enjoying a cup of coffee and reading the local newspaper.",
      era: "1945"
    }
  ],
  "1965": [
    {
      name: "coffeeMachine",
      description: "1960s Automatic drip coffee maker: Revolutionizing café service with batch brewing, allowing faster service during the lunch rush.",
      era: "1965"
    },
    {
      name: "menuBoard",
      description: "Backlit menu board with rotating specials: Features the new 'Turkey Melt' sandwich and 'Twist' dance contest announcements on weekends.",
      era: "1965"
    },
    {
      name: "jukebox",
      description: "Seeburg 100B jukebox: Playing the latest Motown hits and Beatles records, reflecting the British Invasion and Motown sound taking overn sound revolution.",
      era: "1965"
    },
    {
      name: "poster1",
      description: "Civil rights poster: 'Freedom Now' SNCC poster reflecting the growing civil rights movement and local activism in the community.",
      era: "1965"
    },
    {
      name: "counter",
      description: "Formica-topped service counter: Easy-to-clean surface representative of 1960s modern design, with a newer electric cash register.",
      era: "1965"
    },
    {
      name: "patron1",
      description: "College student with beatnik style: Reading Kerouac's 'On the Road' while discussing civil rights over coffee, representing the era's youth culture.",
      era: "1965"
    }
  ],
  "1985": [
    {
      name: "coffeeMachine",
      description: "1980s Super-automatic espresso machine: Fully automated system that grinds, tamps, and brews with touch-button operation, reflecting the technology boom.",
      era: "1985"
    },
    {
      name: "menuBoard",
      description: "Digital menu display: Early LCD screen showing rotating specials and prices, representing the dawn of computer technology in small businesses.",
      era: "1985"
    },
    {
      name: "jukebox",
      description: "CD jukebox: Playing popular 80s hits from Madonna, Michael Jackson, and Prince, reflecting the transition from vinyl to digital music.",
      era: "1985"
    },
    {
      name: "poster1",
      description: "MTV poster: Promoting the new music television channel that revolutionized music promotion and youth culture in the 1980s.",
      era: "1985"
    },
    {
      name: "counter",
      description: "Laminated counter with integrated card terminal: Early credit card processing technology reflecting the growing importance of electronic payments.",
      era: "1985"
    },
    {
      name: "patron1",
      description: "Business professional with shoulder-length hair: Reading USA Today on break from nearby office, representing the rise of dual-income households and yuppie culture.",
      era: "1985"
    }
  ],
  "2005": [
    {
      name: "coffeeMachine",
      description: "2000s High-end espresso setup: Dual boiler PID-controlled machine for precise temperature control, reflecting the third wave coffee movement.",
      era: "2005"
    },
    {
      name: "menuBoard",
      description: "Chalkboard menu with artisanal offerings: Features single-origin pour-over coffee, fair-trade espresso drinks, and locally sourced pastries.",
      era: "2005"
    },
    {
      name: "jukebox",
      description: "Digital touchscreen jukebox: iPod dock with 10,000 song library, allowing customers to create playlists from their own music collections.",
      era: "2005"
    },
    {
      name: "poster1",
      description: "Fair trade certification poster: Promoting ethical coffee sourcing and direct relationships with farmers, reflecting growing consumer awareness.",
      era: "2005"
    },
    {
      name: "counter",
      description: "Recycled glass countertop: Environmentally friendly surface made from recycled bottles, paired with a modern touchscreen POS system.",
      era: "2005"
    },
    {
      name: "patron1",
      description: "Freelance web designer: Working on a laptop while drinking a pour-over coffee, representing the growth of the gig economy and remote work culture.",
      era: "2005"
    }
  ],
  "2025": [
    {
      name: "coffeeMachine",
      description: "2020s AI-assisted espresso machine: Uses machine learning to optimize extraction based on bean origin, humidity, and barista technique.",
      era: "2025"
    },
    {
      name: "menuBoard",
      description: "Holographic menu display: Floating 3D images of menu items that customers can interact with to see ingredients and nutritional information.",
      era: "2025"
    },
    {
      name: "jukebox",
      description: "AI-powered music recommendation system: Creates personalized playlists based on customer preferences, time of day, and local events.",
      era: "2025"
    },
    {
      name: "poster1",
      description: "Augmented reality poster: Scanning with smartphone shows interactive history of the café from 1945 to present day with interviews and photos.",
      era: "2025"
    },
    {
      name: "counter",
      description: "Contactless payment counter: Wireless charging surface for phones and integrated cryptocurrency payment terminal alongside traditional card reader.",
      era: "2025"
    },
    {
      name: "patron1",
      description: "Remote work professional: Using augmented reality glasses for a virtual meeting while enjoying a plant-based oat milk latte.",
      era: "2025"
    }
  ]
};

// Make available globally
window.hotspotData = hotspotData;