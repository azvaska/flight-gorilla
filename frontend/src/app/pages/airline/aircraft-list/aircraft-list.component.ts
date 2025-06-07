import { Component } from '@angular/core';
import {NgForOf, NgOptimizedImage} from '@angular/common';
import { AirlineAircraft } from '@/types/airline/airlineAircraft';
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

@Component({
  selector: 'app-aircrafts-list',
  templateUrl: './aircraft-list.component.html',
  providers: [provideIcons({ lucideEllipsis })],
  imports: [
    NgForOf,
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
  host: {
    class: 'block w-full h-fit',
  },
})
export class AircraftListComponent {
  // Dummy data for demonstration purposes
  aircrafts: AirlineAircraft[] = [
    { id: '0', model: 'Boeing 737', tailNumber: 'N12345', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '1', model: 'Airbus A320', tailNumber: 'F-GKXB', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', firstClassSeats: ["1A"], businessClassSeats: ["1B"], economyClassSeats: ["1C"]},
  ];

  constructor() {
    // duplicate 5 times the first element in "aircraft" array
    let newAircrafts = Array(5).fill(this.aircrafts[0]);
    this.aircrafts = [...this.aircrafts, ...newAircrafts, ...newAircrafts];

  }
}
