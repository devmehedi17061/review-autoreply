/**
 * The connected Google login (support@ibusinessformula.com.au) is an AGENCY
 * account: it manages many businesses, most of which are unrelated iBF clients
 * (gyms, solar shops, transport, etc.). This product is only for the two RTOs,
 * so we must import ONLY their campuses and never the rest.
 *
 * Each real campus is identified by its RTO code in the Google listing title and
 * routed to the right brand. This also fixes brand assignment: a MultiSkills
 * campus lands under MultiSkills even when the account was connected under ACE.
 *
 * The brand names here must match the `name` of the seeded Brand rows.
 */
const RTO_TO_BRAND: { pattern: RegExp; brandName: string }[] = [
  { pattern: /RTO\s*21716/i, brandName: "ACE Training" },
  { pattern: /RTO\s*40846/i, brandName: "MultiSkills" },
];

/**
 * Returns the brand name a Google location belongs to, or null if it is not an
 * ACE/MST campus (in which case it must be skipped, not imported).
 */
export function resolveBrandName(locationTitle: string): string | null {
  for (const { pattern, brandName } of RTO_TO_BRAND) {
    if (pattern.test(locationTitle)) return brandName;
  }
  return null;
}
