/**
 * Payload extraction for the `patrons` section of the routed shell
 * {@link EraConfig}.
 *
 * Mirrors `signage/extractSignageLighting`: two layouts are accepted so the
 * group survives either integration shape — a carrier object
 * (`{ patrons: {...} }`, matching the field name used by
 * `src/cafe/eras/types.ts`) or the payload keys directly on the section.
 * Returns `undefined` when neither is present (current era stubs), which
 * makes every variant fall back to its period preset.
 */

export interface PatronsPayload {
  /** Rough number of patrons to stage; clamped to 1…6, capped by the cast. */
  headcountHint?: number;
  /** Free-form activity labels, stamped onto the cast for debugging. */
  activityNotes?: string[];
}

const PAYLOAD_KEYS = ['outfits', 'hairstyles', 'gadgets', 'headcountHint', 'activityNotes'] as const;

function isPayloadShape(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return PAYLOAD_KEYS.some((key) => record[key] !== undefined);
}

function readPayload(value: unknown): PatronsPayload | undefined {
  if (!isPayloadShape(value)) return undefined;
  const record = value as Record<string, unknown>;
  const payload: PatronsPayload = {};
  if (typeof record.headcountHint === 'number' && Number.isFinite(record.headcountHint)) {
    payload.headcountHint = record.headcountHint;
  }
  if (Array.isArray(record.activityNotes)) {
    payload.activityNotes = record.activityNotes.filter(
      (note): note is string => typeof note === 'string',
    );
  }
  return PAYLOAD_KEYS.some((key) => payload[key as keyof PatronsPayload] !== undefined)
    ? payload
    : undefined;
}

/**
 * Reads the patrons payload out of the routed `patrons` section.
 *
 * @example
 * extractPatronsPayload({ patrons: { headcountHint: 4 } }); // carrier shape
 * extractPatronsPayload({ headcountHint: 4 });              // direct shape
 */
export function extractPatronsPayload(section: unknown): PatronsPayload | undefined {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  return readPayload(record.patrons) ?? readPayload(record);
}
