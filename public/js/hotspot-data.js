/**
 * Hotspot data — interactive inspection points for every era.
 *
 * Each era declares at least five hotspots placed at key scene elements:
 * the menu board, the coffee machine, the music source, the counter
 * technology (till/POS), and one patron.  Every hotspot carries a label
 * (shown on hover) and a rich detail payload (shown in the side panel on
 * click) that is tailored to the era — a product description, a price list,
 * or a period-specific explanation.
 *
 * World-space positions match the procedural geometry emitted by
 * `src/eras/era-builder.js` so the markers sit precisely on the relevant
 * objects.  The coordinate system matches the café shell:
 *   X: -5 (left wall) .. +5 (right wall)
 *   Z: -4 (back wall)  .. +4 (front / counter wall)
 *   Y:  0 (floor)      .. 3 (ceiling); counter top ≈ 1.08 m
 *
 * @module hotspot-data
 */

/**
 * @typedef {Object} Hotspot
 * @property {string} id            - Unique slug within the era.
 * @property {string} label         - Short label shown on hover.
 * @property {string} category      - 'menu' | 'equipment' | 'music' | 'counter' | 'patron'.
 * @property {[number,number,number]} position - World-space [x, y, z].
 * @property {string} title         - Panel heading.
 * @property {string} subtitle      - Panel secondary line.
 * @property {string} body          - Paragraph(s) of detail (plain text).
 * @property {Array<{name:string,price:string}>} [priceList] - Optional itemised list.
 * @property {Array<{label:string,value:string}>} [specs]    - Optional key/value specs.
 */

/** Counter top surface height (matches era-builder baseY). */
const COUNTER_TOP = 1.08;

/** Back-wall surface Z (matches era-builder WALL_Z_BACK). */
const WALL_Z_BACK = -3.85;

/**
 * All hotspots keyed by era year.
 *
 * @type {Record<number, Hotspot[]>}
 */
export const HOTSPOTS = {
  // -------------------------------------------------------------------------
  // 1945 — Post-War Revival
  // -------------------------------------------------------------------------
  1945: [
    {
      id: 'menu',
      label: 'Menu Board',
      category: 'menu',
      position: [0, 2.0, WALL_Z_BACK + 0.06],
      title: 'Ration-Era Menu',
      subtitle: 'Post-war café prices — 1945',
      body: 'Wartime rationing is still in force in 1945. Coffee itself is in short supply and frequently cut with chicory. The menu is simple and affordable, priced in pre-decimal pence (d). A cup of coffee costs fourpence — less than the price of a newspaper today.',
      priceList: [
        { name: 'Coffee', price: '4d' },
        { name: 'Tea', price: '3d' },
        { name: 'Bun', price: '2d' },
        { name: 'Sandwich', price: '6d' },
        { name: 'Soup', price: '8d' },
      ],
    },
    {
      id: 'espresso',
      label: 'Coffee Machine',
      category: 'equipment',
      position: [-0.5, COUNTER_TOP + 0.3, 2.85],
      title: 'Manual Lever Espresso Machine',
      subtitle: 'Hand-pulled shots, 1945',
      body: 'Before electric pumps, espresso was made on a lever-operated machine. The barista pulls down a spring-loaded piston to force hot water through the grounds. It takes real skill and muscle — each shot is a small feat of engineering. Two pressure gauges let the barista judge the pull.',
      specs: [
        { label: 'Type', value: 'Lever (spring piston)' },
        { label: 'Operation', value: 'Manual' },
        { label: 'Gauges', value: '2 × pressure' },
        { label: 'Body', value: 'Tarnished brass & wood' },
      ],
    },
    {
      id: 'music',
      label: 'Wireless Set',
      category: 'music',
      position: [-4.0, 0.7, -2.0],
      title: 'Walnut Wireless Radio',
      subtitle: 'BBC Home Service — 1945',
      body: 'A polished walnut-cabinet wireless set brings the BBC Home Service into the café. Swing-era big-band music fills the room between news bulletins and shipping forecasts. The valves take a moment to warm up, and the dial glows a soft amber as the barista tunes between stations.',
      specs: [
        { label: 'Source', value: 'Wireless (valve radio)' },
        { label: 'Station', value: 'BBC Home Service' },
        { label: 'Style', value: 'Swing-era big band' },
        { label: 'Cabinet', value: 'Walnut veneer' },
      ],
    },
    {
      id: 'counter',
      label: 'Cash Register',
      category: 'counter',
      position: [1.2, COUNTER_TOP + 0.2, 2.9],
      title: 'Brass Cash Register',
      subtitle: 'Manual till — 1945',
      body: 'A heavy brass cash register with mechanical keys and a pop-up amount display. Each key rings a bell as the drawer slides open with a satisfying clunk. No electricity required — just good old-fashioned springs and levers, polished to a warm shine.',
      specs: [
        { label: 'Type', value: 'Manual mechanical' },
        { label: 'Material', value: 'Brass' },
        { label: 'Display', value: 'Pop-up number flags' },
        { label: 'Payment', value: 'Cash only' },
      ],
    },
    {
      id: 'patron',
      label: 'Gentleman with Newspaper',
      category: 'patron',
      position: [-3.2, 1.35, 0.3],
      title: 'A Gentleman Reading',
      subtitle: 'Period attire — 1945',
      body: 'A patron in a double-breasted suit reads the morning paper over his coffee. Men of the era favour tailored suits, ties, and hats even for a casual café visit. Short, neatly combed hair and polished shoes complete the look. The newspaper carries war headlines on the front page.',
      specs: [
        { label: 'Outfit', value: 'Double-breasted suit' },
        { label: 'Hair', value: 'Short, slicked' },
        { label: 'Accessory', value: 'Newspaper' },
        { label: 'Era', value: 'Immediate post-war' },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // 1965 — Swinging Sixties
  // -------------------------------------------------------------------------
  1965: [
    {
      id: 'menu',
      label: 'Menu Board',
      category: 'menu',
      position: [0, 2.0, WALL_Z_BACK + 0.06],
      title: 'Swinging Sixties Menu',
      subtitle: 'Café prices — 1965',
      body: 'Britain still uses pounds, shillings, and pence (pre-decimal). Espresso has arrived and is the height of sophistication. A cappuccino costs two shillings — a fashionable indulgence. The jukebox in the corner plays the latest hits as customers linger over coffee and cake.',
      priceList: [
        { name: 'Espresso', price: '1/6' },
        { name: 'Cappuccino', price: '2/-' },
        { name: 'Coffee', price: '1/3' },
        { name: 'Tea', price: '1/-' },
        { name: 'Cake', price: '2/6' },
      ],
    },
    {
      id: 'espresso',
      label: 'Coffee Machine',
      category: 'equipment',
      position: [-0.5, COUNTER_TOP + 0.3, 2.85],
      title: 'Faema E61-Style Machine',
      subtitle: 'Electric pump espresso — 1965',
      body: 'The revolutionary Faema E61 introduced continuous electric pump pressure, replacing the lever arm. This chrome-and-steel beauty produces consistent 9-bar shots with far less effort, helping espresso culture boom. A single pressure gauge watches over the brew.',
      specs: [
        { label: 'Type', value: 'Electric pump (E61-style)' },
        { label: 'Operation', value: 'Semi-automatic' },
        { label: 'Gauges', value: '1 × pump pressure' },
        { label: 'Body', value: 'Polished chrome' },
      ],
    },
    {
      id: 'music',
      label: 'Jukebox',
      category: 'music',
      position: [-3.8, 1.1, -1.8],
      title: 'Wurlitzer-Style Jukebox',
      subtitle: 'Motown & Beat music — 1965',
      body: 'A towering, glowing jukebox dominates the corner, its bubble tubes cycling through colours. For a coin, customers select the latest Motown soul and Beat music singles. The mechanical arm selects the 45rpm record and drops it onto the turntable with a satisfying clunk.',
      specs: [
        { label: 'Source', value: 'Jukebox (45rpm singles)' },
        { label: 'Style', value: 'Motown & Beat' },
        { label: 'Feature', value: 'Glowing bubble tubes' },
        { label: 'Format', value: 'Vinyl single' },
      ],
    },
    {
      id: 'counter',
      label: 'Cash Register',
      category: 'counter',
      position: [1.2, COUNTER_TOP + 0.25, 2.9],
      title: 'Mechanical Cash Register',
      subtitle: 'Ornate till — 1965',
      body: 'A taller, more ornate mechanical register with a pop-up number display showing the amount due. Chrome trim and colourful keys make this register a centrepiece of the counter. Still entirely mechanical — press a key and the bell rings.',
      specs: [
        { label: 'Type', value: 'Mechanical' },
        { label: 'Display', value: 'Pop-up flags' },
        { label: 'Keys', value: '2 rows × 5' },
        { label: 'Payment', value: 'Cash only' },
      ],
    },
    {
      id: 'patron',
      label: 'Mod in Bright Dress',
      category: 'patron',
      position: [3.2, 1.35, 0.3],
      title: 'A Mod Girl',
      subtitle: 'Sixties fashion — 1965',
      body: 'A young woman in a bright orange shift dress embodies mod fashion. Bold geometric patterns, vivid colours, and long straight hair define the look. Beat music and fashion go hand in hand — the jukebox is never far away.',
      specs: [
        { label: 'Outfit', value: 'Bright shift dress' },
        { label: 'Hair', value: 'Long & straight' },
        { label: 'Style', value: 'Mod' },
        { label: 'Era', value: 'Swinging Sixties' },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // 1985 — Neon Eighties
  // -------------------------------------------------------------------------
  1985: [
    {
      id: 'menu',
      label: 'Menu Board',
      category: 'menu',
      position: [0, 2.0, WALL_Z_BACK + 0.06],
      title: 'Eighties Menu',
      subtitle: 'Café prices — 1985',
      body: 'Decimal currency is now well established. The latte has arrived from Italy and cappuccino is mainstream. Prices hover under a pound for most drinks. The menu board glows under harsh fluorescent tubes and the typeface is unmistakably eighties — monospaced and angular.',
      priceList: [
        { name: 'Espresso', price: '£0.65' },
        { name: 'Cappuccino', price: '£0.85' },
        { name: 'Latte', price: '£0.95' },
        { name: 'Tea', price: '£0.40' },
        { name: 'Croissant', price: '£0.70' },
        { name: 'Cheesecake', price: '£1.20' },
      ],
    },
    {
      id: 'espresso',
      label: 'Coffee Machine',
      category: 'equipment',
      position: [-0.5, COUNTER_TOP + 0.3, 2.85],
      title: 'Commercial Pump Machine',
      subtitle: 'Pressure-gauge espresso — 1985',
      body: 'A substantial commercial espresso machine with twin pressure gauges monitors both pump and boiler pressure. Stainless steel and black plastic give it a utilitarian, industrial look. Electric pump pressure is now standard, and the steam wand hisses constantly as milk drinks grow in popularity.',
      specs: [
        { label: 'Type', value: 'Electric pump' },
        { label: 'Operation', value: 'Semi-automatic' },
        { label: 'Gauges', value: '2 × pump + boiler' },
        { label: 'Body', value: 'Stainless steel & plastic' },
      ],
    },
    {
      id: 'music',
      label: 'Boombox',
      category: 'music',
      position: [-2.0, 1.0, -2.5],
      title: 'Portable Boombox',
      subtitle: 'Synth-pop & new wave — 1985',
      body: 'A portable boombox blares synth-pop and new wave from a cassette tape. Twin speakers and a carrying handle make it the must-have accessory. The tape deck whirs and hisses, and the volume is never quite low enough. Welcome to the sound of the eighties.',
      specs: [
        { label: 'Source', value: 'Boombox' },
        { label: 'Format', value: 'Cassette tape' },
        { label: 'Style', value: 'Synth-pop / new wave' },
        { label: 'Feature', value: 'Twin speakers' },
      ],
    },
    {
      id: 'counter',
      label: 'Cash Register',
      category: 'counter',
      position: [1.2, COUNTER_TOP + 0.2, 2.9],
      title: 'Electronic Cash Register',
      subtitle: 'LED display till — 1985',
      body: 'An electronic cash register with a glowing red LED display replaces the old mechanical keys. It calculates change automatically and prints a receipt on thermal paper. The flat keypad and digital readout mark the dawn of electronic retail.',
      specs: [
        { label: 'Type', value: 'Electronic' },
        { label: 'Display', value: 'Red LED' },
        { label: 'Feature', value: 'Auto change calc' },
        { label: 'Payment', value: 'Cash only' },
      ],
    },
    {
      id: 'patron',
      label: 'Woman with Walkman',
      category: 'patron',
      position: [3.2, 1.35, 0.3],
      title: 'Woman with a Walkman',
      subtitle: 'Eighties style — 1985',
      body: 'A woman in a hot-pink jacket with big curly hair listens to a Sony Walkman. Shoulder pads, bold colours, and portable electronics define the decade. The foam headphones deliver her favourite mix tape as she sips her latte.',
      specs: [
        { label: 'Outfit', value: 'Shoulder-pad jacket' },
        { label: 'Hair', value: 'Big & curly' },
        { label: 'Accessory', value: 'Sony Walkman' },
        { label: 'Era', value: 'Neon Eighties' },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // 2005 — Noughties Chillout
  // -------------------------------------------------------------------------
  2005: [
    {
      id: 'menu',
      label: 'Menu Board',
      category: 'menu',
      position: [0, 2.0, WALL_Z_BACK + 0.06],
      title: 'Noughties Menu',
      subtitle: 'Café prices — 2005',
      body: 'The second-wave coffee boom is in full swing. A latte costs £2.20 and the panini has become a café staple. Clean Helvetica typography and a minimalist board reflect the early-2000s design ethos. Wifi is just around the corner.',
      priceList: [
        { name: 'Espresso', price: '£1.50' },
        { name: 'Cappuccino', price: '£2.00' },
        { name: 'Latte', price: '£2.20' },
        { name: 'Mocha', price: '£2.40' },
        { name: 'Tea', price: '£1.20' },
        { name: 'Muffin', price: '£1.80' },
        { name: 'Panini', price: '£3.50' },
      ],
    },
    {
      id: 'espresso',
      label: 'Coffee Machine',
      category: 'equipment',
      position: [-0.5, COUNTER_TOP + 0.3, 2.85],
      title: 'Semi-Automatic with LCD',
      subtitle: 'Touchscreen espresso — 2005',
      body: 'A semi-automatic espresso machine now features an LCD touchscreen for programming shot volumes and temperatures. Stainless steel dominates the design language. The on-demand grinder doses freshly ground coffee for every shot — a far cry from the hand-cranked grinder of 1945.',
      specs: [
        { label: 'Type', value: 'Semi-automatic pump' },
        { label: 'Display', value: 'LCD touchscreen' },
        { label: 'Gauges', value: '1 × pressure' },
        { label: 'Body', value: 'Stainless steel' },
      ],
    },
    {
      id: 'music',
      label: 'iPod Dock',
      category: 'music',
      position: [1.5, 1.1, -2.5],
      title: 'iPod in Speaker Dock',
      subtitle: 'Indie & chillout — 2005',
      body: 'An iconic white iPod sits in a speaker dock, holding ten thousand songs in a pocket-sized device. Indie and chillout playlists provide the soundtrack. The click wheel and minimalist white aesthetic define the era — goodbye jukebox, hello digital library.',
      specs: [
        { label: 'Source', value: 'iPod (digital)' },
        { label: 'Storage', value: '10,000 songs' },
        { label: 'Style', value: 'Indie / chillout' },
        { label: 'Feature', value: 'Click wheel' },
      ],
    },
    {
      id: 'counter',
      label: 'POS Terminal',
      category: 'counter',
      position: [1.2, COUNTER_TOP + 0.15, 2.9],
      title: 'Computer POS Terminal',
      subtitle: 'Digital point of sale — 2005',
      body: 'A computerised point-of-sale terminal replaces the cash register. A glowing CRT or early flat-panel monitor displays the order, while the keyboard inputs items into inventory software. Chip-and-PIN cards are beginning to replace signatures, but cash is still king for small purchases.',
      specs: [
        { label: 'Type', value: 'Computer POS' },
        { label: 'Display', value: 'CRT / flat panel' },
        { label: 'Inventory', value: 'Digital' },
        { label: 'Payment', value: 'Cash + Chip & PIN' },
      ],
    },
    {
      id: 'patron',
      label: 'Student with Flip Phone',
      category: 'patron',
      position: [-3.2, 1.35, 0.3],
      title: 'Student with a Flip Phone',
      subtitle: 'Noughties style — 2005',
      body: 'A student in low-rise jeans checks a flip phone while nursing a latte. The T9 keyboard and monochrome screen are the height of mobile technology. Baggy jumpers and straightened hair complete the early-2000s look.',
      specs: [
        { label: 'Outfit', value: 'Low-rise jeans & jumper' },
        { label: 'Hair', value: 'Straight, spiky' },
        { label: 'Accessory', value: 'Flip phone' },
        { label: 'Era', value: 'Noughties' },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // 2025 — Contemporary Artisan
  // -------------------------------------------------------------------------
  2025: [
    {
      id: 'menu',
      label: 'Menu Board',
      category: 'menu',
      position: [0, 2.0, WALL_Z_BACK + 0.06],
      title: 'Artisan Menu',
      subtitle: 'Café prices — 2025',
      body: 'Third-wave coffee has arrived. Oat milk lattes, matcha, and cold brew dominate the board. An avocado toast costs £6.50 and a flat white is £3.50. Bring your own cup for a 20p discount — sustainability is part of the brand. Prices in clean Helvetica on warm recycled board.',
      priceList: [
        { name: 'Espresso', price: '£2.80' },
        { name: 'Flat White', price: '£3.50' },
        { name: 'Oat Latte', price: '£3.80' },
        { name: 'Cold Brew', price: '£4.00' },
        { name: 'Matcha Latte', price: '£4.20' },
        { name: 'Avocado Toast', price: '£6.50' },
        { name: 'Vegan Brownie', price: '£3.20' },
      ],
    },
    {
      id: 'espresso',
      label: 'Coffee Machine',
      category: 'equipment',
      position: [-0.5, COUNTER_TOP + 0.35, 2.85],
      title: 'Smart Touchscreen Machine',
      subtitle: 'Precision espresso — 2025',
      body: 'A fully automatic, app-connected espresso machine with a colour touchscreen profiles every shot. Pressure curves and temperature are programmable to a tenth of a degree. The on-demand grinder auto-doses by weight. It even self-cleans between orders — though the barista still loves to hand-tamp.',
      specs: [
        { label: 'Type', value: 'Fully automatic' },
        { label: 'Display', value: 'Colour touchscreen' },
        { label: 'Connectivity', value: 'Wi-Fi / app' },
        { label: 'Precision', value: 'Programmable curves' },
      ],
    },
    {
      id: 'music',
      label: 'Phone & Smart Speaker',
      category: 'music',
      position: [1.5, 1.1, -2.5],
      title: 'Phone on Smart Speaker',
      subtitle: 'Lo-fi chill beats — 2025',
      body: 'A smartphone streams lo-fi chill beats to a smart speaker via Bluetooth. The playlist is algorithmically curated and never repeats. Voice commands skip tracks and adjust volume. The entire music library lives in the cloud — no physical media in sight.',
      specs: [
        { label: 'Source', value: 'Phone (streaming)' },
        { label: 'Output', value: 'Smart speaker' },
        { label: 'Style', value: 'Lo-fi chill beats' },
        { label: 'Control', value: 'Voice / Bluetooth' },
      ],
    },
    {
      id: 'counter',
      label: 'Tablet POS',
      category: 'counter',
      position: [1.2, COUNTER_TOP + 0.2, 2.9],
      title: 'Contactless Tablet POS',
      subtitle: 'Tap-to-pay — 2025',
      body: 'A sleek tablet POS on a minimal stand accepts contactless payments — tap a phone, watch, or card and the green NFC ring glows. Cash is rare; most transactions are tap-to-pay or mobile wallet. Order tickets go straight to the kitchen digitally.',
      specs: [
        { label: 'Type', value: 'Tablet POS' },
        { label: 'Payment', value: 'Contactless / NFC' },
        { label: 'Wallet', value: 'Apple / Google Pay' },
        { label: 'Cash', value: 'Accepted (rarely used)' },
      ],
    },
    {
      id: 'patron',
      label: 'Remote Worker with Laptop',
      category: 'patron',
      position: [-3.2, 1.35, 0.3],
      title: 'Remote Worker',
      subtitle: 'Contemporary style — 2025',
      body: 'A remote worker types on a phone, earbuds in, nursing an oat latte. Athleisure — leggings, sneakers, and a beanie — is now acceptable café attire. The phone is never more than an arm\'s length away. Welcome to the work-from-anywhere era.',
      specs: [
        { label: 'Outfit', value: 'Athleisure' },
        { label: 'Hair', value: 'Short / casual' },
        { label: 'Accessory', value: 'Phone + earbuds' },
        { label: 'Era', value: 'Contemporary' },
      ],
    },
  ],
};

/**
 * Returns the hotspot list for a given era year.
 *
 * @param {number} year
 * @returns {Hotspot[]}
 */
export function getHotspotsForYear(year) {
  return HOTSPOTS[year] ?? [];
}

export default HOTSPOTS;
