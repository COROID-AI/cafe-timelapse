import type { EraYear, Menu_item } from "../state/types";

/**
 * Period menu boards. Source of truth for menu items per era;
 * consumed by eraConfig.ts and the MenuBoard scene component.
 */

const MENU_1945: Menu_item[] = [
  { name: "Coffee (Drip)", price: 0.05 },
  { name: "Tea", price: 0.05 },
  { name: "Donut", price: 0.05 },
  { name: "Sandwich", price: 0.15 },
];

const MENU_1965: Menu_item[] = [
  { name: "Espresso", price: 0.25 },
  { name: "Cappuccino", price: 0.35 },
  { name: "Pastry", price: 0.2 },
];

const MENU_1985: Menu_item[] = [
  { name: "Latte", price: 1.5 },
  { name: "Muffin", price: 0.95 },
  { name: "Espresso", price: 1.0 },
];

const MENU_2005: Menu_item[] = [
  { name: "Mocha", price: 3.75 },
  { name: "Scone", price: 2.25 },
  { name: "Drip Refill", price: 0.5 },
];

const MENU_2025: Menu_item[] = [
  { name: "Flat White", price: 5.0 },
  { name: "Cold Brew", price: 5.5 },
  { name: "Almond Croissant", price: 4.5 },
];

const MENU_2055: Menu_item[] = [
  { name: "Synthesized Blend", price: 12.0 },
  { name: "Neural Espresso", price: 15.0 },
  { name: "Quantum Latte", price: 18.0 },
];

export const MENUS: Record<EraYear, Menu_item[]> = {
  1945: MENU_1945,
  1965: MENU_1965,
  1985: MENU_1985,
  2005: MENU_2005,
  2025: MENU_2025,
  2055: MENU_2055,
};

/** Formats a price with period-appropriate notation (cents before 1985). */
export function formatPrice(price: number, year: EraYear): string {
  if (year <= 1965 && price < 1) {
    return `${Math.round(price * 100)}\u00A2`;
  }
  return `$${price.toFixed(2)}`;
}

/** Builds the chalk/letter/screen lines rendered onto the menu board texture. */
export function boardLines(items: Menu_item[], year: EraYear): string[] {
  const lines = items.map((item) => `${item.name} ... ${formatPrice(item.price, year)}`);
  lines.push("FRESH BREW DAILY");
  return lines;
}
