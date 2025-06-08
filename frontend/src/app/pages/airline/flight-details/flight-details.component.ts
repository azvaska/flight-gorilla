import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight } from '@ng-icons/lucide';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IAirlineFlight } from '@/types/airline/flight';
import { firstValueFrom } from 'rxjs';
import { formatDate, formatTime } from '@/utils/date';

@Component({
  selector: 'flight-details',
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmCardDirective,
    NgIcon,
    RouterLink
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideArrowRight })],
  templateUrl: './flight-details.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class FlightDetailsComponent implements OnInit {
  protected flight: IAirlineFlight | null = null;
  private flightId: string = '';

  constructor(
    private route: ActivatedRoute,
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.flightId = this.route.snapshot.paramMap.get('flightId') || '';
    if (this.flightId) {
      this.fetchFlight();
    }
  }

  private async fetchFlight() {
    try {
      this.loadingService.startLoadingTask();
      this.flight = await firstValueFrom(this.airlineFetchService.getFlight(this.flightId));
    } catch (error) {
      console.error('Error fetching flight:', error);
    } finally {
      this.loadingService.endLoadingTask();
    }
  }

  protected formatDate(date: string) {
    return formatDate(new Date(date), 'specific');
  }

  protected formatTime(time: string) {
    return formatTime(new Date(time));
  }
}
