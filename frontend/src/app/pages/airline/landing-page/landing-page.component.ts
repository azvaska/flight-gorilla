import { Component } from '@angular/core';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  imports: [HlmCardDirective],
  host: {
    class: 'block w-full h-fit',
  },
})
export class LandingPageComponent {

}
