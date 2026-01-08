import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EnvironmentDebugger {
    constructor() {
        console.log('Current environment configuration:');
        console.log('API URL:', environment.apiUrl);
        console.log('Chat Hub:', environment.chatHub);
        console.log('Base URL:', environment.baseUrl);
        console.log('Production mode:', environment.production);
    }
}
