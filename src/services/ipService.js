export async function getPublicIPv4() {
    
    // Try primary fetcher
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    
    } catch (error) {
        console.warn("Primary IP fetch failed, trying fallback...", error);
        
        // Primary failed, try Amazon backup
        try {
            const response = await fetch("https://checkip.amazonaws.com");
            const ip = await response.text();
            return ip.trim(); // .trim() removes any whitespace/newline Amazon adds
        
        } catch (fallbackError) {
            // Both failed, throw error up to caller
            console.error("Fallback IP fetch also failed.", fallbackError);
            throw fallbackError;
        }
    }
}
export async function getIPGeoInfo(ip) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error("IP geo API failed");
    const data = await response.json();
    
    return {
      country: data.country_name,
      country_code: data.country_code,
      region: data.region,
      city: data.city,
      ipTimezone: data.timezone,  // e.g. "America/New_York"
    };
  } catch (error) {
    console.error("IP geo fetch failed:", error);
    return { ipTimezone: "unknown" };
  }
}