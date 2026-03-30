export function getBrowserFingerprint() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || navigator.userLanguage,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    screenRes: `${screen.width}x${screen.height}`,
  };
}