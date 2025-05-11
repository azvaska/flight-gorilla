import {Component, Input} from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';

@Component({
  selector: 'app-booking1-overview',
  imports: [HlmButtonDirective, RouterLink],
  templateUrl: './booking1-overview.component.html'
})
export class Booking1OverviewComponent {
  constructor(private router: Router, private route: ActivatedRoute) {}
}

