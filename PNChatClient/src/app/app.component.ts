import { Component } from '@angular/core';
import { EnvironmentDebugger } from './core/debug/environment-debugger';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'PNChatClient';

  constructor(private envDebugger: EnvironmentDebugger) {}

  ngOnInit() {
    // Log environment details to console to debug API URL issues
    console.log('Environment API URL:', environment.apiUrl);
    console.log('Environment baseUrl:', environment.baseUrl);
    
    window.addEventListener('beforeunload', () => {
      localStorage.clear();
      // Optionally, you can also make a logout API call here if needed
    });
  }
}
