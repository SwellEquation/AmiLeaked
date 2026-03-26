export function evaluateVPNLikelihood(browserFp, ipGeo) {
  const reasons = [];
  const mismatches = [];

  // Timezone mismatch (primary signal)
  if (browserFp.timezone !== ipGeo.ipTimezone) {
    mismatches.push("Timezone mismatch");
  }

  // Language region vs IP country (rough)
  const langRegion = (browserFp.language || "").split("-")[1];
  if (langRegion && langRegion !== ipGeo.country_code) {
    mismatches.push("Language region mismatch");
  }

  const vpnLikely = mismatches.length > 0;
  return {
    vpnLikely,
    confidence: mismatches.length,
    mismatches,
  };
}