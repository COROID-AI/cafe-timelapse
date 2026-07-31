import { ERAS } from '../data/eras';

/**
 * Imports the per-era registry modules so their side-effect registration runs.
 * Keeping registrations in separate modules lets the QA gate and future
 * tooling load exactly the eras they need.
 */
export async function registerAllEras(): Promise<void> {
  await Promise.all(
    ERAS.map(async (era) => {
      switch (era) {
        case 1945:
          await import('./eras/1945');
          break;
        case 1965:
          await import('./eras/1965');
          break;
        case 1985:
          await import('./eras/1985');
          break;
        case 2005:
          await import('./eras/2005');
          break;
        case 2025:
          await import('./eras/2025');
          break;
        case 2055:
          await import('./eras/2055');
          break;
      }
    }),
  );
}
