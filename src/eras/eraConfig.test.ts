import { describe, expect, it } from "vitest";
import {
  ERA_CONFIGS,
  ERA_YEARS,
  getAllEraConfigs,
  getEraConfig,
} from "./eraConfig";
import { MENUS, formatPrice } from "./menus";
import { POSTERS } from "./posters";

/** AC4: era completeness + pairwise-distinct category values. */

const ALL_ERAS = getAllEraConfigs();

describe("era roster", () => {
  it("defines exactly the six brief years, ascending", () => {
    expect([...ERA_YEARS]).toEqual([1945, 1965, 1985, 2005, 2025, 2055]);
  });

  it("exposes one config per year with no extras", () => {
    expect(Object.keys(ERA_CONFIGS).map(Number).sort((a, b) => a - b)).toEqual([
      ...ERA_YEARS,
    ]);
    expect(getAllEraConfigs()).toHaveLength(6);
  });

  it("lookups agree between getEraConfig and the table", () => {
    for (const year of ERA_YEARS) {
      expect(getEraConfig(year)).toBe(ERA_CONFIGS[year]);
      expect(getEraConfig(year).year).toBe(year);
    }
  });
});

describe("per-era completeness", () => {
  it.each([...ERA_YEARS])("%i has every detail category populated", (year) => {
    const era = ERA_CONFIGS[year];

    // Palette + lighting rig
    for (const swatch of Object.values(era.palette)) {
      expect(swatch).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    expect(era.lighting.style.length).toBeGreaterThan(0);
    expect(era.lighting.intensity).toBeGreaterThan(0);

    // Furniture / equipment / signage / tableware / counter tech
    expect(era.furnitureStyle.length).toBeGreaterThan(0);
    expect(era.coffeeMachineKind.length).toBeGreaterThan(0);
    expect(era.signageStyle.length).toBeGreaterThan(0);
    expect(era.tablewareSet.length).toBeGreaterThan(0);
    expect(era.counterTechKind.length).toBeGreaterThan(0);

    // Menu board with priced items
    expect(MENUS[year].length).toBeGreaterThan(0);
    for (const item of MENUS[year]) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThanOrEqual(0);
    }

    // Posters/adverts
    expect(POSTERS[year].length).toBeGreaterThanOrEqual(3);
    for (const poster of POSTERS[year]) {
      expect(poster.title.length).toBeGreaterThan(0);
      expect(poster.artist.length).toBeGreaterThan(0);
      expect(poster.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    // Patron roster with outfits, hairstyles and gadgets
    expect(era.patrons.length).toBeGreaterThanOrEqual(3);
    for (const patron of era.patrons) {
      expect(patron.name.length).toBeGreaterThan(0);
      expect(patron.outfit.label.length).toBeGreaterThan(0);
      expect(patron.outfit.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(patron.hairstyle.length).toBeGreaterThan(0);
      expect(patron.gadget.length).toBeGreaterThan(0);
    }

    // Music source prop pairs with its own generative program
    expect(era.musicSourcePropId.length).toBeGreaterThan(0);
    expect(era.musicProgramId.length).toBeGreaterThan(0);
    expect(era.menuItems.length).toBeGreaterThan(0);
  });
});

describe("pairwise-distinct categories (AC4)", () => {
  function assertAllDistinct(
    key: keyof (typeof ALL_ERAS)[number],
    label: string,
  ): void {
    const seen = new Map<string, number>();
    for (const era of ALL_ERAS) {
      const value = String(era[key]);
      seen.set(value, (seen.get(value) ?? 0) + 1);
    }
    for (const [value, count] of seen) {
      expect(count, `${label} "${value}" shared by multiple eras`).toBe(1);
    }
  }

  it("furniture style differs across all six eras", () =>
    assertAllDistinct("furnitureStyle", "furnitureStyle"));
  it("coffee equipment differs across all six eras", () =>
    assertAllDistinct("coffeeMachineKind", "coffeeMachineKind"));
  it("counter technology differs across all six eras", () =>
    assertAllDistinct("counterTechKind", "counterTechKind"));
  it("music source prop differs across all six eras", () =>
    assertAllDistinct("musicSourcePropId", "musicSourcePropId"));
  it("music program differs across all six eras", () =>
    assertAllDistinct("musicProgramId", "musicProgramId"));
  it("signage style differs across all six eras", () =>
    assertAllDistinct("signageStyle", "signageStyle"));
  it("tableware differs across all six eras", () =>
    assertAllDistinct("tablewareSet", "tablewareSet"));
  it("lighting rig style differs across all six eras", () => {
    const styles = new Set(ALL_ERAS.map((e) => e.lighting.style));
    expect(styles.size).toBe(ALL_ERAS.length);
  });
  it("wall palette differs across all six eras", () => {
    const walls = new Set(ALL_ERAS.map((e) => e.palette.wall));
    expect(walls.size).toBe(ALL_ERAS.length);
  });
});

describe("period mapping fidelity (AC6)", () => {
  it("walks the music-source lineage radio → orb", () => {
    const lineage = ALL_ERAS.map((e) => e.musicSourcePropId);
    expect(lineage).toEqual([
      "wireless-radio",
      "jukebox",
      "boombox",
      "ipod-dock",
      "smartphone-speaker",
      "holographic-orb",
    ]);
  });

  it("pairs each source with its own distinct program", () => {
    const programs = ALL_ERAS.map((e) => e.musicProgramId);
    expect(programs).toEqual([
      "swing-jazz",
      "rock-n-roll",
      "synth-pop",
      "pop-dance",
      "lofi-house",
      "ambient-scifi",
    ]);
  });

  it("progresses counter tech till → biometric holographic pad", () => {
    const kinds = ALL_ERAS.map((e) => e.counterTechKind.toLowerCase());
    expect(kinds[0]).toContain("till");
    expect(kinds[1]).toContain("register");
    expect(kinds[2]).toContain("pos");
    expect(kinds[3]).toContain("touchscreen");
    expect(kinds[4]).toContain("contactless");
    expect(kinds[5]).toContain("biometric");
  });

  it("moves menu boards chalkboard → volumetric holo", () => {
    const signage = ALL_ERAS.map((e) => e.signageStyle.toLowerCase());
    expect(signage[0]).toContain("chalk");
    expect(signage[1]).toContain("letter");
    expect(signage[2]).toContain("backlit");
    expect(signage[5]).toContain("holo");
  });

  it("prices inflate across the decades", () => {
    let prevAvg = -Infinity;
    for (const year of ERA_YEARS) {
      const items = MENUS[year];
      const avg =
        items.reduce((sum, item) => sum + item.price, 0) / items.length;
      expect(avg).toBeGreaterThan(prevAvg);
      prevAvg = avg;
    }
  });
});

describe("menu formatting", () => {
  it("uses cent notation in the pre-inflation years", () => {
    expect(formatPrice(0.05, 1945)).toBe("5¢");
    expect(formatPrice(0.25, 1965)).toBe("25¢");
  });

  it("uses dollar notation from the cassette decade onward", () => {
    expect(formatPrice(1.5, 1985)).toBe("$1.50");
    expect(formatPrice(5.5, 2025)).toBe("$5.50");
    expect(formatPrice(18, 2055)).toBe("$18.00");
  });
});
