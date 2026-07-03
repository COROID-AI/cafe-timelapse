/**
 * Data contract defining the shape of era-specific content for the café timelapse.
 * @typedef {Object} PeriodPackage
 * @property {number} year - The year of the era (e.g., 1945)
 * @property {string} name - Display name of the era
 * @property {string} theme - Theme descriptor for the era
 * @property {string[]} furniture - List of furniture items
 * @property {string[]} decor - List of decor items
 * @property {{ items: { name: string; price: number; description: string }[], board: Object }} menu - Menu configuration
 * @property {{
 *   music: { id: string; type: string; volume: number },
 *   sfx: { type: string; id: string }[],
 *   ambientNoise: string
 * }} audio - Audio configuration
 * @property {{ color: string; intensity: number; fixtureType: string }} lighting - Lighting configuration
 * @property {{ posters: string[]; menuBoard: Object; windowDisplays: string[] }} signage - Signage configuration
 * @property {{ outfits: string[]; hairstyles: string[]; gadgets: string[] }} patrons - Patron attributes
 * @property {string} counterTech - Technology at the counter
 */

export const PeriodPackageSchema = {
  year: 0,
  name: '',
  theme: '',
  furniture: [],
  decor: [],
  menu: {
    items: [{ name: '', price: 0, description: '' }],
    board: {}
  },
  audio: {
    music: { id: '', type: '', volume: 0 },
    sfx: [{ type: '', id: '' }],
    ambientNoise: ''
  },
  lighting: { color: '', intensity: 0, fixtureType: '' },
  signage: {
    posters: [],
    menuBoard: {},
    windowDisplays: []
  },
  patrons: { outfits: [], hairstyles: [], gadgets: [] },
  counterTech: ''
};

// JavaScript runtime representation of PeriodPackage
// TypeScript types are available via JSDoc annotations above
export const PeriodPackage = {
  year: 0,
  name: '',
  theme: '',
  furniture: [],
  decor: [],
  menu: {
    items: [{ name: '', price: 0, description: '' }],
    board: {}
  },
  audio: {
    music: { id: '', type: '', volume: 0 },
    sfx: [{ type: '', id: '' }],
    ambientNoise: ''
  },
  lighting: { color: '', intensity: 0, fixtureType: '' },
  signage: {
    posters: [],
    menuBoard: {},
    windowDisplays: []
  },
  patrons: { outfits: [], hairstyles: [], gadgets: [] },
  counterTech: ''
};
