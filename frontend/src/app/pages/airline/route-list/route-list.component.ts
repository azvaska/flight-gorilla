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
import { IRoute } from '@/types/airline/route';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { firstValueFrom } from 'rxjs';

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
  protected routes: IRoute[] = [];

  constructor(private airlineFetchService: AirlineFetchService, private loadingService: LoadingService) {
    this.fetchRoutes().then((routes) => {
      this.routes = routes;
    });
  }

  private async fetchRoutes() {
    this.loadingService.startLoadingTask();
    const routes = await firstValueFrom(this.airlineFetchService.getRoutes());
    this.loadingService.endLoadingTask();
    return routes;
  }


  protected formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
