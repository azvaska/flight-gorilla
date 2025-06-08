import { Component } from '@angular/core';
import {NgForOf, NgOptimizedImage} from "@angular/common";

import {dateToString} from '@/utils/date';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {RouterLink} from '@angular/router';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {
  HlmCardDirective,
} from '@spartan-ng/ui-card-helm';
import { lucideEllipsis } from '@ng-icons/lucide';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';

export interface AirlineRoute {
  id: number;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  period_start: Date;
  period_end: Date;
}


@Component({
  selector: 'app-route-list',
  imports: [
    NgForOf,
    NgOptimizedImage,
    HlmButtonDirective,
    RouterLink,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    HlmCardDirective,
    NgIcon,
    PopoverComponent,
    PopoverTriggerDirective,
  ],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './route-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class RouteListComponent {
  routes : AirlineRoute[] = [
    {
      id: 1,
      flight_number: 'FL123',
      departure_airport: 'JFK',
      arrival_airport: 'LAX',
      period_start: new Date('2023-10-01T08:00:00Z'),
      period_end: new Date('2024-10-31T20:00:00Z'),
    },
    {
      id: 2,
      flight_number: 'FL456',
      departure_airport: 'LAX',
      arrival_airport: 'ORD',
      period_start: new Date('2023-11-01T08:00:00Z'),
      period_end: new Date('2025-12-30T20:00:00Z'),
    },
  ];

  constructor() {
    // Duplicate the first element in "routes" array 15 times (test purposes)
    const newRoutes = Array(15).fill(this.routes[0]);
    this.routes = [...this.routes, ...newRoutes, ...newRoutes];
  }


  protected readonly dateToString = dateToString;
}
