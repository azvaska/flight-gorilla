import {Component, signal} from '@angular/core';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {BrnPopoverComponent, BrnPopoverContentDirective, BrnPopoverTriggerDirective} from '@spartan-ng/brain/popover';
import {HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {
  HlmCommandComponent, HlmCommandEmptyDirective,
  HlmCommandGroupComponent, HlmCommandIconDirective, HlmCommandItemComponent,
  HlmCommandListComponent,
  HlmCommandSearchComponent, HlmCommandSearchInputComponent
} from '@spartan-ng/ui-command-helm';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideCheck, lucideChevronsUpDown, lucideSearch} from '@ng-icons/lucide';
import {BrnCommandEmptyDirective} from '@spartan-ng/brain/command';
import {NgForOf} from '@angular/common';

interface Route {
  id: number;
  name: string;
}

@Component({
  selector: 'app-flights-add',
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    BrnPopoverComponent,
    BrnPopoverTriggerDirective,
    BrnPopoverContentDirective,
    HlmPopoverContentDirective,
    HlmCommandComponent,
    NgIcon,
    HlmCommandSearchComponent,
    HlmCommandListComponent,
    HlmCommandGroupComponent,
    HlmCommandItemComponent,
    HlmCommandIconDirective,
    BrnCommandEmptyDirective,
    HlmCommandEmptyDirective,
    HlmCommandSearchInputComponent,
    NgForOf
  ],
  providers: [provideIcons({ lucideChevronsUpDown, lucideSearch, lucideCheck })],
  templateUrl: './flights-add.component.html'
})
export class FlightsAddComponent {
  routes: Route[] = [
    { id: 1, name: 'VCE-CTA  02/25-09/25' },
    { id: 2, name: 'FCO-CTA  04/24-02/27' },
    { id: 3, name: 'MXP-CTA  05/25-03/26' },
    { id: 4, name: 'NAP-CTA  12/24-07/28' },
    { id: 5, name: 'TRN-CTA  01/25-06/25' },
    { id: 6, name: 'BLQ-CTA  11/22-07/26' },
    { id: 7, name: 'PMO-CTA  03/25-09/26' },
    { id: 8, name: 'PSR-CTA  09/25-12/29' }
  ]

  public currentModel = signal<Route | undefined>(undefined);
  public state = signal<'closed' | 'open'>('closed');

  stateChanged(state: 'open' | 'closed') {
    this.state.set(state);
  }

  commandSelected(route: Route) {
    if (this.currentModel()?.name !== route.name) {
      this.currentModel.set(route);
    }
    this.state.set('closed');
  }
}
