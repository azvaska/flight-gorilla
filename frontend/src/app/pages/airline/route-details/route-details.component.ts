import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight } from '@ng-icons/lucide';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IRoute } from '@/types/airline/route';
import { firstValueFrom } from 'rxjs';
import { formatDate, formatTime } from '@/utils/date';

@Component({
  selector: 'app-route-details',
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmCardDirective,
    NgIcon,
    RouterLink
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideArrowRight })],
  templateUrl: './route-details.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class RouteDetailsComponent implements OnInit {
  protected route: IRoute | null = null;
  private routeId: number | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.routeId = Number(this.activatedRoute.snapshot.paramMap.get('routeId'));
    if (this.routeId) {
      this.fetchRoute();
    }
  }

  private async fetchRoute() {
    try {
      this.loadingService.startLoadingTask();
      this.route = await firstValueFrom(this.airlineFetchService.getRoute(this.routeId!));
    } catch (error) {
      console.error('Error fetching route:', error);
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
