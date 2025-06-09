import { Component } from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import { dateToString, formatTime } from '@/utils/date';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { Router, RouterLink } from '@angular/router';
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
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/brain/alert-dialog';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

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
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogTitleDirective,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogActionButtonDirective,
    HlmSpinnerComponent,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    HlmAlertDialogCancelButtonDirective,
  ],
  providers: [provideIcons({ lucideEllipsis })  ],
  templateUrl: './flights-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class FlightsListComponent {
  protected flights: IAirlineFlight[] = [];
  protected isDeleteFlightLoading = false;

  constructor(
    private airlineFetchService: AirlineFetchService, 
    private loadingService: LoadingService,
    private router: Router
  ) {
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

  protected formatTime(time: string) {
    return formatTime(new Date(time));
  }

  protected dateToString(date: string) {
    return dateToString(new Date(date), 'specific');
  }

  protected async deleteFlight(flightId: string, modalCtx: any) {
    this.isDeleteFlightLoading = true;
    try {
      await firstValueFrom(this.airlineFetchService.deleteFlight(flightId));
      this.flights = this.flights.filter((flight) => flight.id !== flightId);
    } catch (error) {
      console.error('error deleting flight');
    } finally {
      this.isDeleteFlightLoading = false;
      modalCtx.close();
    }
  }
}
