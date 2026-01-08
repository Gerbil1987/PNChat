import { environment } from 'src/environments/environment';

/**
 * Utility class for handling API URLs
 */
export class UrlHelper {
    /**
     * Ensures that the URL uses the server IP address instead of localhost
     */
    static ensureCorrectUrl(url: string): string {
        if (url.includes('localhost:5129')) {
            return url.replace('localhost:5129', '197.242.158.172:5129');
        }
        return url;
    }

    /**
     * Gets the base API URL
     */
    static get apiBaseUrl(): string {
        return environment.apiUrl || 'http://197.242.158.172:5129/api/';
    }

    /**
     * Gets the base server URL
     */
    static get baseUrl(): string {
        return environment.baseUrl || 'http://197.242.158.172:5129/';
    }

    /**
     * Gets the chat hub URL
     */
    static get chatHubUrl(): string {
        return environment.chatHub || 'http://197.242.158.172:5129/chatHub';
    }
}
