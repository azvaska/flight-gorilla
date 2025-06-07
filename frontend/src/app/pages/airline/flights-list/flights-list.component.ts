import { Component } from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import { dateToString, formatTime } from '@/utils/date';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { RouterLink } from '@angular/router';
import {
  HlmTableComponent,
  HlmTrowComponent,
  HlmThComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { lucideEllipsis } from '@ng-icons/lucide';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';

export interface Flight {
  id: number;
  route_id: number;
  aircraft_id: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: Date;
  arrival_time: Date;
  checkin_start: Date;
  checkin_end: Date;
  boarding_start: Date;
  boarding_end: Date;
  gate: string;
  terminal: string;
  price_first_class: number;
  price_business_class: number;
  price_insurance: number;
}

@Component({
  selector: 'app-flights-list',
  imports: [
    NgForOf,
    HlmButtonDirective,
    RouterLink,
    NgIf,
    HlmCardDirective,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    NgIcon,
    PopoverComponent,
    PopoverTriggerDirective,
  ],
  providers: [provideIcons({ lucideEllipsis })  ],
  templateUrl: './flights-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class FlightsListComponent {
  flights: Flight[] = [
    {
      id: 1,
      route_id: 101,
      aircraft_id: 'AC001',
      departure_airport: 'JFK',
      arrival_airport: 'LAX',
      departure_time: new Date('2024-01-15T09:00:00Z'),
      arrival_time: new Date('2024-01-15T12:00:00Z'),
      checkin_start: new Date('2024-01-15T06:00:00Z'),
      checkin_end:   new Date('2024-01-15T08:00:00Z'),
      boarding_start: new Date('2024-01-15T08:30:00Z'),
      boarding_end:   new Date('2024-01-15T08:50:00Z'),
      gate: 'A12',
      terminal: '4',
      price_first_class: 1200,
      price_business_class: 800,
      price_insurance: 50,
    },
    {
      id: 2,
      route_id: 102,
      aircraft_id: 'AC002',
      departure_airport: 'LAX',
      arrival_airport: 'ORD',
      departure_time: new Date('2024-02-20T14:00:00Z'),
      arrival_time: new Date('2024-02-20T18:00:00Z'),
      checkin_start: new Date('2024-02-20T11:00:00Z'),
      checkin_end:   new Date('2024-02-20T13:00:00Z'),
      boarding_start: new Date('2024-02-20T13:30:00Z'),
      boarding_end:   new Date('2024-02-20T13:50:00Z'),
      gate: 'B7',
      terminal: '2',
      price_first_class: 1100,
      price_business_class: 750,
      price_insurance: 45,
    },
    // …add more flights here as needed
  ];

  // Which flight (if any) is currently open in the popup:
  selectedFlight: Flight | null = null;

  protected readonly dateToString = dateToString;
  protected readonly formatTime = formatTime;

  openDetails(f: Flight) {
    this.selectedFlight = f;
  }

  closeDetails() {
    this.selectedFlight = null;
  }
}
