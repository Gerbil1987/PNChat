import { Component } from '@angular/core';
import { EnvironmentDebugger } from './core/debug/environment-debugger';
import { NotificationDebugService } from './core/service/notification-debug.service';
import { ScreenshotProtectionService } from './core/service/screenshot-protection.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'PNChatClient';

  constructor(
    private envDebugger: EnvironmentDebugger,
    private notificationDebugService: NotificationDebugService,
    private screenshotProtectionService: ScreenshotProtectionService
  ) {}

  ngOnInit() {
    // Log environment details to console to debug API URL issues
    console.log('Environment API URL:', environment.apiUrl);
    console.log('Environment baseUrl:', environment.baseUrl);
    
    // Log notification system status
    this.notificationDebugService.printStatusSummary();
    
    // Confirm screenshot protection is active
    console.log('📸 Screenshot protection is active and monitoring for screenshot attempts');
    
    window.addEventListener('beforeunload', () => {
      localStorage.clear();
      // Optionally, you can also make a logout API call here if needed
    });
  }
}
