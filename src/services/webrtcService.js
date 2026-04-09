const STUN_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const GATHER_TIMEOUT = 3000;

const PRIVATE_IP_REGEX = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|fc|fd)/;
const CANDIDATE_IP_REGEX = /candidate:\S+ \d+ \S+ \d+ (\S+) \d+ typ (srflx|host)/;

function isPrivateIP(ip) {
    return PRIVATE_IP_REGEX.test(ip);
}

export async function getWebRTCIPs() {
    if (typeof RTCPeerConnection === "undefined") {
        return null;
    }

    return new Promise((resolve) => {
        const pc = new RTCPeerConnection(STUN_CONFIG);
        const ips = new Set();
        let resolved = false;

        const finish = () => {
            if (resolved) return;
            resolved = true;
            pc.close();

            const localIPs = [];
            let publicIP = null;

            for (const ip of ips) {
                if (isPrivateIP(ip)) {
                    localIPs.push(ip);
                } else {
                    publicIP = ip;
                }
            }

            resolve({ localIPs, publicIP });
        };

        const timeout = setTimeout(finish, GATHER_TIMEOUT);

        pc.onicecandidate = (event) => {
            if (!event.candidate) {
                clearTimeout(timeout);
                finish();
                return;
            }

            const match = event.candidate.candidate.match(CANDIDATE_IP_REGEX);
            if (match) {
                const ip = match[1];
                // Filter out mDNS .local candidates
                if (!ip.endsWith(".local")) {
                    ips.add(ip);
                }
            }
        };

        pc.createDataChannel("");
        pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .catch(() => {
                clearTimeout(timeout);
                finish();
            });
    });
}
