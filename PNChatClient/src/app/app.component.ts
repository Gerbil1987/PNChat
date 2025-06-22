import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'PNChatClient';

  ngOnInit() {
    window.addEventListener('beforeunload', () => {
      localStorage.clear();
      // Optionally, you can also make a logout API call here if needed
    });
  }
}
