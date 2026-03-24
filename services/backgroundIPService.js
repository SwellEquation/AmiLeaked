// backgroundIPService.js

// This service captures the device's IP address periodically and logs it.

class BackgroundIPService {
    constructor() {
        this.ipAddress = null;
        this.intervalId = null;
    }

    startCapture() {
        this.intervalId = setInterval(() => {
            this.captureIP();
        }, 60000); // Capture IP every minute
    }

    captureIP() {
        // Fetch the IP address from a public API
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                this.ipAddress = data.ip;
                console.log(`Captured IP Address: ${this.ipAddress}`);
            })
            .catch(error => console.error('Error fetching IP:', error));
    }

    stopCapture() {
        clearInterval(this.intervalId);
        console.log('Stopped capturing IP Address.');
    }
}

// Example usage:
const backgroundIPService = new BackgroundIPService();
backgroundIPService.startCapture();