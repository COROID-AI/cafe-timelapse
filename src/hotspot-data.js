/**
 * @file src/hotspot-data.js
 * Authored content for hotspot popups: per-era object titles + 2-3 sentence copy.
 * The 3D hotspot positions live inside each era module; this file maps the
 * (eraId, hotspotId) pair to human-readable title + body text.
 *
 * @type {Record<string, Record<string, {title:string, body:string}>>}
 */
export const HOTSPOT_DATA = {
  1945: {
    music: {
      title: 'Cathedral Wireless Set',
      body: 'A Philco 46-200 cathedral radio — the centerpiece of every American parlor in 1945. AM only, hand-wound wooden dial, glowing to the big-band swing of Glenn Miller and Benny Goodman. The whole café gathers around it for the evening news.'
    },
    menu: {
      title: 'Chalkboard Menu',
      body: 'Hand-lettered on slate: a cup of coffee for a nickel, a sandwich for fifteen cents, pie for a dime. No espresso drinks yet — just drip from the percolator, strong and honest. Sugar is still rationed.'
    },
    counter: {
      title: 'Crank Cash Register',
      body: 'A National Brass Register — every sale punched by hand, the lever cranked, and a brass bell rings to signal the total. Receipts are optional; most transactions are rung up on the keys and trusted to memory.'
    },
    equipment: {
      title: 'Stove-Top Percolator',
      body: 'No espresso machine here — coffee is brewed the old-fashioned way, recirculated through a basket on a gas burner until it reaches a rolling, aromatic strength. The hiss and gurgle is the heartbeat of the morning rush.'
    },
    patron: {
      title: 'Post-War Regulars',
      body: 'A man in a fedora and three-piece suit, a woman with victory-roll hair and a print dress — the fashions of a nation celebrating the end of the war. No phones, no screens; just conversation, newspapers, and the radio.'
    }
  },
  1965: {
    music: {
      title: 'Wurlitzer Jukebox',
      body: 'A Wurlitzer 1015 bubble tube jukebox glowing in the corner — drop in a dime and pick the Motown or British Invasion hit of your choice. The Supremes, The Beatles, The Rolling Stones compete for airtime.'
    },
    menu: {
      title: 'Printed Menu',
      body: 'Espresso has arrived: twenty-five cents, cappuccino thirty-five. A BLT is sixty-five cents, a slice of cheesecake forty. The coffee bar is becoming modern, one short cup at a time.'
    },
    counter: {
      title: 'Adding-Machine Register',
      body: 'A mechanical adding machine with a paper tape — punch the keys, pull the lever, and the total prints itself out. It is faster than the old crank register, and the paper trail keeps the books honest.'
    },
    equipment: {
      title: 'Faema Lever Espresso Machine',
      body: 'The first generation of lever-pulled espresso — a spring-loaded piston forces water through the puck, no electric pump required. The barista pulls each shot by hand, and the crema is a revelation to American palates.'
    },
    patron: {
      title: 'Mod Fashion',
      body: 'Bouffant hair and miniskirts, slim suits and thin ties, go-go boots and thick-rimmed glasses — the mid-century café is a runway. Everyone is young, stylish, and reading the latest Life magazine.'
    }
  },
  1985: {
    music: {
      title: 'Boombox on the Counter',
      body: 'A twin-speaker boombox blasting synth-pop and new wave — Depeche Mode, Madonna, Duran Duran. The tape deck eats cassettes occasionally, but the bass carries across the whole café.'
    },
    menu: {
      title: 'Trapper-Keeper Menu',
      body: 'The café latte is born here: $1.85, a tall milky drink that defines the decade. Espresso is a dollar, a croissant $1.25. The menu board is neon-pink, color-coordinated with the decor.'
    },
    counter: {
      title: 'Digital Register',
      body: 'An electronic cash register with a glowing green fluorescent display — no more hand-cranks, just a beep and a printed receipt. The cash drawer springs open automatically with a satisfying ding.'
    },
    equipment: {
      title: 'Two-Group Espresso Machine',
      body: 'A chrome E61 two-group machine with pump-driven groups and a steam wand — the workhorse of the 80s coffee bar. It pulls shot after shot for the new wave of latte and cappuccino drinkers.'
    },
    patron: {
      title: 'Big Hair & Shoulder Pads',
      body: 'Teased hair, shoulder pads, leg warmers, Members Only jackets. Someone is always wearing a Walkman with foam headphones, and aviator sunglasses are mandatory indoors.'
    }
  },
  2005: {
    music: {
      title: 'iPod Dock',
      body: 'A white iPod sits in a speaker dock, its click-wheel scrolling through a curated playlist of indie folk and downtempo. The barista is the DJ; the café\'s mood rises and falls with her shuffle.'
    },
    menu: {
      title: 'Single-Origin Menu',
      body: 'Third-wave has arrived: pour-over is $4.00, a latte $3.50. Beans are single-origin, roasted last week, brewed by hand on a Hario V60. A scone is $2.75, and the chalkboard lists the farm name.'
    },
    counter: {
      title: 'Flat-Screen POS',
      body: 'An early touchscreen point-of-sale on a swing arm — the café is computerized. Orders fly to the barista on a thermal printer, and loyalty cards stack up by the register.'
    },
    equipment: {
      title: 'Commercial Espresso & Grinder',
      body: 'A polished two-group commercial machine paired with a Mazzer grinder, plus a pour-over tower for single cups. Every variable — dose, temperature, time — is tracked in the pursuit of the perfect extraction.'
    },
    patron: {
      title: 'The Laptop Campers',
      body: 'Polo shirts and messenger bags, early MacBooks open on the reclaimed-wood tables. Someone is wearing the white earbuds of a new iPod, and "Free Wi-Fi" is the most important sign on the wall.'
    }
  },
  2025: {
    music: {
      title: 'Bluetooth Speaker',
      body: 'A smart speaker streams a lo-fi chill playlist curated by an algorithm. The music adapts to the time of day and the crowd — upbeat in the morning, mellow in the afternoon.'
    },
    menu: {
      title: 'QR Digital Menu',
      body: 'Scan the QR code: an oat latte is $5.75, a specialty flight $7.50, avocado toast $9.00. Almond, soy, and oat milk are all listed. The menu updates in real time with what is still in stock.'
    },
    counter: {
      title: 'Contactless POS',
      body: 'A Square-style terminal with tap-to-pay — phones and watches do the paying, no cash changes hands. The barista names the drink, the customer taps, and the receipt lands in an email.'
    },
    equipment: {
      title: 'Modbar Under-Counter Brewer',
      body: 'A multi-boiler Modbar system hides the machinery under the counter; only sleek taps show on top. Automated pour-overs and pressure-profiled espresso make every cup reproducible to the gram.'
    },
    patron: {
      title: 'The Always-On Crowd',
      body: 'Phones in hand, AirPods in ears, slim laptops open. Sustainable fashion, tote bags, oat-milk lattes. The café is a co-working space as much as a coffee shop — everyone is online, all the time.'
    }
  }
};

/**
 * @param {string} eraId
 * @param {string} hotspotId
 * @returns {{title:string, body:string}|null}
 */
export function getHotspotText(eraId, hotspotId) {
  const era = HOTSPOT_DATA[eraId];
  if (!era) return null;
  return era[hotspotId] || null;
}
