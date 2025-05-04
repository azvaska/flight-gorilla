import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmButtonDirective],
  templateUrl: './app.component.html',
})
export class AppComponent {

  onClick() {
    console.log('clicked');
  }
}
