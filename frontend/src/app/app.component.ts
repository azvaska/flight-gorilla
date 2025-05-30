import { Component } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/ui/navbar/navbar.component';
import { LoadingComponent } from './components/ui/loading/loading.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, LoadingComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    window.addEventListener('popstate', () => {
      location.reload();
    });
  }
}
