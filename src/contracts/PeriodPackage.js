/**
 * @file src/contracts/PeriodPackage.js
 * @description
 * Single source of truth for the per-era café data contract.
 *
 * Every era module (js/period1945.js … js/period2025.js) must return an object
 * that conforms to `PeriodPackage`. The `validatePeriodPackage()` function is
 * used at module-load time to fail fast when an era pack is missing required
 * keys, preventing partially-populated eras from reaching the renderer.
 *
 * ---------------------------------------------------------------------------
 * TOP-LEVEL KEYS (all required):
 *
 *   furniture         — tables, chairs, counters, shelving geometry + materials
 *   decor             — wall art, plants, rugs, ceiling fans, misc ambience
 *   coffeeMachine     — espresso/brewing equipment model + animation hooks
 *   menu              — menu board items, each with a period-accurate price
 *   musicSource       — playback device (wireless set, jukebox, …) + track id
 *   wallPosters[]     — advertisements and posters displayed on walls
 *   tableware         — cups, saucers, plates, cutlery materials/geometry
 *   signage           — exterior/interior signs, neon, chalkboards
 *   lighting          — ambient, accent, and fixture lighting configuration
 *   counterTech       — point-of-sale / counter technology (till → contactless)
 *   patrons           — patron appearance: outfits, hairstyles, gadgets
 *   sfx               — ambient sound effects: murmur, machine hiss, clatter
 *   navigationHotspots— camera navigation anchor points for close-up viewing
 *
 * ---------------------------------------------------------------------------
 * DESIGN RULES:
 *   - Era modules MUST NOT introduce ad-hoc top-level fields outside this
 *     schema. Extra metadata goes in `meta`.
 *   - All asset references are string URIs so heavy textures/audio can be
 *     code-split and loaded lazily by the era module's dynamic import().
 *   - Prices are strings with currency symbol to preserve period formatting
 *     (e.g. "3d", "15¢", "$1.25", "£2.50").
 */

// ─────────────────────────────────────────────────────────────────────────────
// JSDoc Type Definitions (single source of truth — era modules conform to these)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A 3D asset reference: a mesh model URI plus optional texture/material URIs.
 * @typedef {Object} AssetRef
 * @property {string} mesh      — URI to the 3D model (e.g. "assets/1945/chair.glb")
 * @property {string} [texture] — URI to the diffuse texture
 * @property {string} [material]— URI or preset name for the material config
 * @property {string} [normalMap]— URI to the normal map texture
 * @property {string} [roughnessMap]— URI to the roughness map texture
 */

/**
 * A piece of furniture with its placement.
 * @typedef {Object} FurnitureItem
 * @property {string} id        — unique slug (e.g. "table-round-small")
 * @property {string} label     — human-readable label
 * @property {string} type      — "table" | "chair" | "counter" | "shelf" | "stool" | "bar"
 * @property {AssetRef} asset   — 3D asset reference
 * @property {[number,number,number]} position — world-space [x, y, z]
 * @property {[number,number,number]} [rotation] — Euler [x, y, z] in radians
 * @property {number} [scale]   — uniform scale multiplier (default 1)
 */

/**
 * A decorative element.
 * @typedef {Object} DecorItem
 * @property {string} id        — unique slug
 * @property {string} label     — human-readable label
 * @property {string} category  — "artwork" | "plant" | "rug" | "fixture" | "misc"
 * @property {AssetRef} [asset] — 3D asset (optional for purely logical decor)
 * @property {[number,number,number]} position — world-space position
 * @property {[number,number,number]} [rotation]
 */

/**
 * Coffee machine / brewing equipment definition.
 * @typedef {Object} CoffeeMachine
 * @property {string} id        — unique slug
 * @property {string} type      — "lever-espresso" | "pourover" | "drip" | "pod" | "auto-espresso"
 * @property {string} brand     — period-appropriate brand/name
 * @property {AssetRef} asset   — 3D asset reference
 * @property {[number,number,number]} position
 * @property {boolean} hasSteamWand — whether the model has a steam wand animation
 * @property {string} [brewAnimation] — URI or preset for the brewing animation
 * @property {string} [hissSound] — sound effect for the machine hiss
 */

/**
 * A menu board item with a period-accurate price.
 * @typedef {Object} MenuItem
 * @property {string} id        — unique slug (e.g. "espresso")
 * @property {string} name      — display name (e.g. "Espresso")
 * @property {string} price     — price string with currency (e.g. "15¢", "$1.25")
 * @property {string} [description]— optional description for the board
 */

/**
 * The menu board configuration.
 * @typedef {Object} Menu
 * @property {string} boardType  — "chalkboard" | "printed" | "led" | "paper" | "digital"
 * @property {string} [boardAsset]— URI to the board texture/model
 * @property {MenuItem[]} items  — menu items with prices
 */

/**
 * Music playback source.
 * @typedef {Object} MusicSource
 * @property {string} model     — "wireless-set" | "jukebox" | "boombox" | "ipod" | "phone" | "speaker"
 * @property {string} trackId   — identifier for the track to play
 * @property {string} [trackName]— human-readable track name
 * @property {AssetRef} [asset] — 3D asset for the playback device
 * @property {string} [audioUri]— URI to the audio file
 * @property {number} [volume]  — base volume 0–1
 */

/**
 * A wall poster or advertisement.
 * @typedef {Object} WallPoster
 * @property {string} id        — unique slug
 * @property {string} title     — poster/ad title
 * @property {string} textureUri— URI to the poster texture
 * @property {[number,number,number]} position — wall position
 * @property {[number,number,number]} [rotation]
 * @property {number} [width]    — width in world units
 * @property {number} [height]   — height in world units
 */

/**
 * Tableware definition.
 * @typedef {Object} Tableware
 * @property {string} cupStyle  — style description (e.g. "porcelain-cup-saucer")
 * @property {string} plateStyle
 * @property {string} cutleryStyle
 * @property {AssetRef} [cupAsset]
 * @property {AssetRef} [plateAsset]
 * @property {AssetRef} [cutleryAsset]
 * @property {string} [material]— material preset name
 */

/**
 * Signage configuration.
 * @typedef {Object} Signage
 * @property {string} exteriorType— "painted" | "neon" | "backlit" | "led" | "vinyl"
 * @property {string} [exteriorText]— text on the exterior sign
 * @property {string} [exteriorAsset]
 * @property {Object[]} [interiorSigns]— additional interior signs
 * @property {string} interiorSigns[].text
 * @property {string} [interiorSigns[].type]— "chalkboard" | "printed" | "neon" | "digital"
 * @property {AssetRef} [interiorSigns[].asset]
 */

/**
 * Lighting configuration.
 * @typedef {Object} Lighting
 * @property {string} ambientType— "tungsten" | "fluorescent" | "warm-led" | "neon" | "candle"
 * @property {number} ambientIntensity— ambient light intensity 0–3
 * @property {string} [colorTemperature]— "warm" | "cool" | "neutral" | "kelvin:NNNN"
 * @property {Object[]} [fixtures]— individual light fixtures
 * @property {string} fixtures[].type— "pendant" | "sconce" | "track" | "chandelier" | "strip"
 * @property {AssetRef} [fixtures[].asset]
 * @property {[number,number,number]} [fixtures[].position]
 * @property {number} [fixtures[].intensity]
 */

/**
 * Counter / point-of-sale technology.
 * @typedef {Object} CounterTech
 * @property {string} posType   — "manual-till" | "mechanical-register" | "electronic-register" | "touchscreen-pos" | "tablet-pos" | "contactless"
 * @property {string} [posAsset]
 * @property {string} [paymentMethods]— description of accepted payment methods
 * @property {AssetRef} [asset] — 3D asset for the POS device
 * @property {[number,number,number]} [position]
 */

/**
 * A single patron appearance definition.
 * @typedef {Object} PatronAppearance
 * @property {string} id        — unique slug
 * @property {string} outfit    — outfit description (e.g. "zoot-suit", "tie-dye-tee")
 * @property {string} hairstyle — hairstyle description
 * @property {string[]} [gadgets]— gadget slugs (e.g. "newspaper", "walkman", "smartphone")
 * @property {AssetRef} [asset] — 3D asset for the patron model
 * @property {[number,number,number]} [position]
 */

/**
 * Patron population definition.
 * @typedef {Object} Patrons
 * @property {PatronAppearance[]} appearances — array of patron appearance presets
 * @property {number} [count]   — suggested number of patrons in the scene
 */

/**
 * Ambient sound effects.
 * @typedef {Object} Sfx
 * @property {string} murmur      — sound URI or preset for conversation murmur
 * @property {string} machineHiss — sound URI or preset for the coffee machine hiss
 * @property {string} clatter     — sound URI or preset for cup/plate clatter
 * @property {number} [murmurVolume]    — volume 0–1
 * @property {number} [machineHissVolume]
 * @property {number} [clatterVolume]
 */

/**
 * A navigation hotspot for close-up viewing.
 * @typedef {Object} NavigationHotspot
 * @property {string} id        — unique slug (e.g. "counter-closeup")
 * @property {string} label     — human-readable label
 * @property {[number,number,number]} cameraPosition— camera anchor position
 * @property {[number,number,number]} [lookAt]      — point the camera looks at
 * @property {number} [fov]     — field of view in degrees
 */

/**
 * Era metadata.
 * @typedef {Object} PeriodMeta
 * @property {number} year       — the era year (e.g. 1945)
 * @property {string} name       — era display name
 * @property {string} [description]
 */

/**
 * The complete per-era café data package.
 * This is the SINGLE SOURCE OF TRUTH contract that all era modules must satisfy.
 * @typedef {Object} PeriodPackage
 * @property {PeriodMeta} meta          — era metadata
 * @property {FurnitureItem[]} furniture— furniture items
 * @property {DecorItem[]} decor        — decorative elements
 * @property {CoffeeMachine} coffeeMachine — coffee/brewing equipment
 * @property {Menu} menu                — menu board and items with prices
 * @property {MusicSource} musicSource  — music playback source + track
 * @property {WallPoster[]} wallPosters — wall advertisements/posters
 * @property {Tableware} tableware      — cups, plates, cutlery
 * @property {Signage} signage          — exterior/interior signs
 * @property {Lighting} lighting        — lighting configuration
 * @property {CounterTech} counterTech  — counter/POS technology
 * @property {Patrons} patrons          — patron appearances (outfits/hairstyles/gadgets)
 * @property {Sfx} sfx                  — ambient sound effects
 * @property {NavigationHotspot[]} navigationHotspots — camera navigation points
 */

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical list of required top-level keys on a PeriodPackage.
 * Era modules must provide ALL of these keys — no ad-hoc fields allowed.
 * @type {readonly string[]}
 */
export const PERIOD_PACKAGE_REQUIRED_KEYS = Object.freeze([
  'meta',
  'furniture',
  'decor',
  'coffeeMachine',
  'menu',
  'musicSource',
  'wallPosters',
  'tableware',
  'signage',
  'lighting',
  'counterTech',
  'patrons',
  'sfx',
  'navigationHotspots',
]);

/**
 * Required keys on the `meta` sub-object.
 * @type {readonly string[]}
 */
const META_REQUIRED_KEYS = Object.freeze(['year', 'name']);

/**
 * Required keys on the `menu` sub-object.
 * @type {readonly string[]}
 */
const MENU_REQUIRED_KEYS = Object.freeze(['boardType', 'items']);

/**
 * Required keys on the `musicSource` sub-object.
 * @type {readonly string[]}
 */
const MUSIC_SOURCE_REQUIRED_KEYS = Object.freeze(['model', 'trackId']);

/**
 * Required keys on the `sfx` sub-object.
 * @type {readonly string[]}
 */
const SFX_REQUIRED_KEYS = Object.freeze(['murmur', 'machineHiss', 'clatter']);

/**
 * Required keys on the `patrons` sub-object.
 * @type {readonly string[]}
 */
const PATRONS_REQUIRED_KEYS = Object.freeze(['appearances']);

/**
 * Required keys on the `coffeeMachine` sub-object.
 * @type {readonly string[]}
 */
const COFFEE_MACHINE_REQUIRED_KEYS = Object.freeze([
  'id', 'type', 'brand', 'asset', 'position', 'hasSteamWand',
]);

/**
 * Required keys on the `tableware` sub-object.
 * @type {readonly string[]}
 */
const TABLEWARE_REQUIRED_KEYS = Object.freeze([
  'cupStyle', 'plateStyle', 'cutleryStyle',
]);

/**
 * Required keys on the `signage` sub-object.
 * @type {readonly string[]}
 */
const SIGNAGE_REQUIRED_KEYS = Object.freeze(['exteriorType']);

/**
 * Required keys on the `lighting` sub-object.
 * @type {readonly string[]}
 */
const LIGHTING_REQUIRED_KEYS = Object.freeze(['ambientType', 'ambientIntensity']);

/**
 * Required keys on the `counterTech` sub-object.
 * @type {readonly string[]}
 */
const COUNTER_TECH_REQUIRED_KEYS = Object.freeze(['posType']);

/**
 * Validate that a value is an array.
 * @param {*} value
 * @param {string} keyPath
 * @throws {TypeError} if not an array
 */
function requireArray(value, keyPath) {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `PeriodPackage validation failed: "${keyPath}" must be an array, got ${describeType(value)}`,
    );
  }
}

/**
 * Validate that a value is a non-empty string.
 * @param {*} value
 * @param {string} keyPath
 * @throws {TypeError} if not a non-empty string
 */
function requireNonEmptyString(value, keyPath) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(
      `PeriodPackage validation failed: "${keyPath}" must be a non-empty string, got ${describeType(value)}`,
    );
  }
}

/**
 * Validate that a value is an object (not null, not array).
 * @param {*} value
 * @param {string} keyPath
 * @throws {TypeError} if not a plain object
 */
function requireObject(value, keyPath) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(
      `PeriodPackage validation failed: "${keyPath}" must be an object, got ${describeType(value)}`,
    );
  }
}

/**
 * Human-readable type description for error messages.
 * @param {*} value
 * @returns {string}
 */
function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

/**
 * Check that an object contains all required keys.
 * @param {Object} obj         — the object to check
 * @param {readonly string[]} requiredKeys
 * @param {string} keyPath     — dotted path for error messages (e.g. "menu")
 * @throws {Error} if any required key is missing
 */
function requireKeys(obj, requiredKeys, keyPath) {
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      throw new Error(
        `PeriodPackage validation failed: missing required key "${keyPath}.${key}"`,
      );
    }
  }
}

/**
 * Validate a complete PeriodPackage object.
 *
 * Throws on the first missing or malformed key. Used at era-module load time
 * to fail fast and prevent partially-populated eras from reaching the renderer.
 *
 * @param {PeriodPackage} pkg — the package to validate
 * @returns {PeriodPackage}  — the validated package (same reference, for chaining)
 * @throws {Error} if any required top-level key is missing
 * @throws {TypeError} if sub-objects have wrong types or missing required keys
 *
 * @example
 * import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';
 * const pkg = create1945Package();
 * validatePeriodPackage(pkg); // throws if broken
 */
export function validatePeriodPackage(pkg) {
  requireObject(pkg, 'root');

  // Top-level required keys
  requireKeys(pkg, PERIOD_PACKAGE_REQUIRED_KEYS, 'root');

  // meta
  requireObject(pkg.meta, 'meta');
  requireKeys(pkg.meta, META_REQUIRED_KEYS, 'meta');
  if (typeof pkg.meta.year !== 'number') {
    throw new TypeError(
      `PeriodPackage validation failed: "meta.year" must be a number, got ${describeType(pkg.meta.year)}`,
    );
  }
  requireNonEmptyString(pkg.meta.name, 'meta.name');

  // furniture — array of FurnitureItem
  requireArray(pkg.furniture, 'furniture');

  // decor — array of DecorItem
  requireArray(pkg.decor, 'decor');

  // coffeeMachine
  requireObject(pkg.coffeeMachine, 'coffeeMachine');
  requireKeys(pkg.coffeeMachine, COFFEE_MACHINE_REQUIRED_KEYS, 'coffeeMachine');

  // menu
  requireObject(pkg.menu, 'menu');
  requireKeys(pkg.menu, MENU_REQUIRED_KEYS, 'menu');
  requireArray(pkg.menu.items, 'menu.items');
  for (let i = 0; i < pkg.menu.items.length; i++) {
    const item = pkg.menu.items[i];
    const prefix = `menu.items[${i}]`;
    requireObject(item, prefix);
    requireNonEmptyString(item.id, `${prefix}.id`);
    requireNonEmptyString(item.name, `${prefix}.name`);
    requireNonEmptyString(item.price, `${prefix}.price`);
  }

  // musicSource
  requireObject(pkg.musicSource, 'musicSource');
  requireKeys(pkg.musicSource, MUSIC_SOURCE_REQUIRED_KEYS, 'musicSource');
  requireNonEmptyString(pkg.musicSource.model, 'musicSource.model');
  requireNonEmptyString(pkg.musicSource.trackId, 'musicSource.trackId');

  // wallPosters — array of WallPoster
  requireArray(pkg.wallPosters, 'wallPosters');

  // tableware
  requireObject(pkg.tableware, 'tableware');
  requireKeys(pkg.tableware, TABLEWARE_REQUIRED_KEYS, 'tableware');
  requireNonEmptyString(pkg.tableware.cupStyle, 'tableware.cupStyle');
  requireNonEmptyString(pkg.tableware.plateStyle, 'tableware.plateStyle');
  requireNonEmptyString(pkg.tableware.cutleryStyle, 'tableware.cutleryStyle');

  // signage
  requireObject(pkg.signage, 'signage');
  requireKeys(pkg.signage, SIGNAGE_REQUIRED_KEYS, 'signage');
  requireNonEmptyString(pkg.signage.exteriorType, 'signage.exteriorType');

  // lighting
  requireObject(pkg.lighting, 'lighting');
  requireKeys(pkg.lighting, LIGHTING_REQUIRED_KEYS, 'lighting');
  requireNonEmptyString(pkg.lighting.ambientType, 'lighting.ambientType');
  if (typeof pkg.lighting.ambientIntensity !== 'number') {
    throw new TypeError(
      `PeriodPackage validation failed: "lighting.ambientIntensity" must be a number, got ${describeType(pkg.lighting.ambientIntensity)}`,
    );
  }

  // counterTech
  requireObject(pkg.counterTech, 'counterTech');
  requireKeys(pkg.counterTech, COUNTER_TECH_REQUIRED_KEYS, 'counterTech');
  requireNonEmptyString(pkg.counterTech.posType, 'counterTech.posType');

  // patrons
  requireObject(pkg.patrons, 'patrons');
  requireKeys(pkg.patrons, PATRONS_REQUIRED_KEYS, 'patrons');
  requireArray(pkg.patrons.appearances, 'patrons.appearances');
  for (let i = 0; i < pkg.patrons.appearances.length; i++) {
    const p = pkg.patrons.appearances[i];
    const prefix = `patrons.appearances[${i}]`;
    requireObject(p, prefix);
    requireNonEmptyString(p.id, `${prefix}.id`);
    requireNonEmptyString(p.outfit, `${prefix}.outfit`);
    requireNonEmptyString(p.hairstyle, `${prefix}.hairstyle`);
  }

  // sfx
  requireObject(pkg.sfx, 'sfx');
  requireKeys(pkg.sfx, SFX_REQUIRED_KEYS, 'sfx');
  requireNonEmptyString(pkg.sfx.murmur, 'sfx.murmur');
  requireNonEmptyString(pkg.sfx.machineHiss, 'sfx.machineHiss');
  requireNonEmptyString(pkg.sfx.clatter, 'sfx.clatter');

  // navigationHotspots — array of NavigationHotspot
  requireArray(pkg.navigationHotspots, 'navigationHotspots');
  for (let i = 0; i < pkg.navigationHotspots.length; i++) {
    const hs = pkg.navigationHotspots[i];
    const prefix = `navigationHotspots[${i}]`;
    requireObject(hs, prefix);
    requireNonEmptyString(hs.id, `${prefix}.id`);
    requireNonEmptyString(hs.label, `${prefix}.label`);
    if (!Array.isArray(hs.cameraPosition) || hs.cameraPosition.length !== 3) {
      throw new TypeError(
        `PeriodPackage validation failed: "${prefix}.cameraPosition" must be a 3-element array`,
      );
    }
  }

  return pkg;
}

export default { validatePeriodPackage, PERIOD_PACKAGE_REQUIRED_KEYS };
