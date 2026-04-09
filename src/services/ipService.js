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
            "https://dns.google/resolve?name=whoami.ds.akahelp.net&type=TXT"
        );
        const data = await response.json();
        
        // Extract IP from Comment field e.g. "Response from 193.108.91.133."
        if (data.Comment) {
            const match = data.Comment.match(/from ([^\s]+)\./);
            if (match) return [match[1]];
        }
        
        return null;
    } catch (error) {
        console.error("DNS capture failed.", error);
        return null;
    }
}
