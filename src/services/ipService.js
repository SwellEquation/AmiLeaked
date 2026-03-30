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


// this website is good for testing ipv6: "https://test-ipv6.com"
export async function getPublicIPv6() {
    try {
        const response = await fetch("https://api6.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn("IPv6 not available on this network.", error);
        return null;
    }
}

export async function getDNSServers() {
    try {
        const response = await fetch(
            "https://cloudflare-dns.com/dns-query?name=whoami.cloudflare&type=TXT",
            { headers: { Accept: "application/dns-json" } }
        );
        const data = await response.json();
        const resolverIPs = (data.Answer || [])
            .filter((r) => r.type === 16)
            .map((r) => r.data.replace(/"/g, "").trim());
        return resolverIPs.length > 0 ? resolverIPs : null;
    } catch (error) {
        console.error("DNS capture failed.", error);
        return null;
    }
}