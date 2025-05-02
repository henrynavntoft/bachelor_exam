import helmet from 'helmet';

export const securityMiddleware = helmet({
    // Enable HSTS for one year
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    // Prevent MIME sniffing
    noSniff: true,
    // Hide the X-Powered-By header
    hidePoweredBy: true,
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"], // Only load resources from the same domain
            scriptSrc: ["'self'"], // Allow scripts with nonce
            styleSrc: ["'self'"], // Allow styles with nonce
            fontSrc: ["'self'"], // Only allow fonts from your domain
            imgSrc: ["'self'", "'https://mg-storage.eu-central-1.linodeobjects.com/*'"],
            connectSrc: ["'self'"], // API calls restricted to self
            objectSrc: ["'none'"], // Disallow plugins (e.g., Flash)
            frameSrc: ["'none'"], // Disallow iframe embedding
            frameAncestors: ["'self'"], // Disallow embedding by other sites
            baseUri: ["'self'"], // Prevent base tag manipulation
            formAction: ["'self'"], // Restrict form submissions to the same domain
            mediaSrc: ["'self'"], // Restrict media (audio/video) to the same domain
            workerSrc: ["'self'"], // Restrict web workers to the same domain
            upgradeInsecureRequests: [], // Automatically upgrade HTTP to HTTPS
        }
    }
});