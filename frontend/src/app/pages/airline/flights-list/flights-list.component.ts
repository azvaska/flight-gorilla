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
import { IAirlineFlight } from '@/types/airline/flight';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { firstValueFrom } from 'rxjs';

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
  protected flights: IAirlineFlight[] = [];

  constructor(private airlineFetchService: AirlineFetchService, private loadingService: LoadingService) {
    this.fetchFlights().then((flights) => {
      this.flights = flights;
    });
  }

  protected async fetchFlights() {
    this.loadingService.startLoadingTask();
    const flights = await firstValueFrom(this.airlineFetchService.getFlights());
    this.loadingService.endLoadingTask();
    return flights;
  }


  // Which flight (if any) is currently open in the popup:
  selectedFlight: IAirlineFlight | null = null;

  openDetails(f: IAirlineFlight) {
    this.selectedFlight = f;
  }

  closeDetails() {
    this.selectedFlight = null;
  }

  protected formatTime(time: string) {
    return formatTime(new Date(time));
  }

  protected dateToString(date: string) {
    return dateToString(new Date(date), 'specific');
  }
}
