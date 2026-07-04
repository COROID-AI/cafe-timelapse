/**
 * @typedef {Object} Era
 * @property {number} year
 * @property {string} name
 * @property {string} theme
 * @property {any[]} furniture
 * @property {any[]} decor
 * @property {{items: Array<{name:string, price:number, description:string}>, board: Object}} menu
 * @property {{music: {id: string|number, type: string, volume: number}, sfx: Array<{type: string, id: string|number}>, ambientNoise: string}} audio
 * @property {{color: string|number, intensity: number, fixtureType: string}} lighting
 * @property {{posters: Array<any>, menuBoard: Object, windowDisplays: Array<any>}} signage
 * @property {{outfits: Array<any>, hairstyles: Array<any>, gadgets: Array<any>}} patrons
 * @property {string} counterTech
 */

/**
 * Validates that an object conforms to the Era shape.
 * @param {Object} obj - The object to validate.
 * @returns {boolean} True if the object matches the Era shape.
 */
export function isEra(obj) {
  // Basic type checks
  if (typeof obj !== 'object' || obj === null) return false;
  if (typeof obj.year !== 'number') return false;
  if (typeof obj.name !== 'string') return false;
  if (typeof obj.theme !== 'string') return false;
  if (!Array.isArray(obj.furniture)) return false;
  if (!Array.isArray(obj.decor)) return false;
  if (typeof obj.menu !== 'object' || obj.menu === null) return false;
  if (!Array.isArray(obj.menu.items)) return false;
  for (const item of obj.menu.items) {
    if (typeof item !== 'object' || item === null) return false;
    if (typeof item.name !== 'string') return false;
    if (typeof item.price !== 'number') return false;
    if (typeof item.description !== 'string') return false;
  }
  if (typeof obj.menu.board !== 'object' || obj.menu.board === null) return false;
  if (typeof obj.audio !== 'object' || obj.audio === null) return false;
  if (typeof obj.audio.music !== 'object' || obj.audio.music === null) return false;
  if (typeof obj.audio.music.id === 'undefined') return false;
  if (typeof obj.audio.music.type !== 'string') return false;
  if (typeof obj.audio.music.volume !== 'number') return false;
  if (!Array.isArray(obj.audio.sfx)) return false;
  for (const sfx of obj.audio.sfx) {
    if (typeof sfx !== 'object' || sfx === null) return false;
    if (typeof sfx.type !== 'string') return false;
    if (typeof sfx.id === 'undefined') return false;
  }
  if (typeof obj.audio.ambientNoise !== 'string') return false;
  if (typeof obj.lighting !== 'object' || obj.lighting === null) return false;
  if (typeof obj.lighting.color === 'undefined') return false;
  if (typeof obj.lighting.intensity !== 'number') return false;
  if (typeof obj.lighting.fixtureType !== 'string') return false;
  if (typeof obj.signage !== 'object' || obj.signage === null) return false;
  if (!Array.isArray(obj.signage.posters)) return false;
  if (typeof obj.signage.menuBoard !== 'object' || obj.signage.menuBoard === null) return false;
  if (!Array.isArray(obj.signage.windowDisplays)) return false;
  if (typeof obj.patrons !== 'object' || obj.patrons === null) return false;
  if (!Array.isArray(obj.patrons.outfits)) return false;
  if (!Array.isArray(obj.patrons.hairstyles)) return false;
  if (!Array.isArray(obj.patrons.gadgets)) return false;
  if (typeof obj.counterTech !== 'string') return false;
  return true;
}