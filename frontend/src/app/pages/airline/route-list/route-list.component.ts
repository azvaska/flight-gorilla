import { Component } from '@angular/core';
import {NgForOf, NgOptimizedImage} from "@angular/common";

import {dateToString} from '@/utils/date';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {Router, RouterLink} from '@angular/router';
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
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

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
    HlmButtonDirective,
    RouterLink,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    HlmCardDirective,
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
    HlmToasterComponent,
  ],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './route-list.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class RouteListComponent {
  protected routes: IRoute[] = [];
  protected isDeleteRouteLoading = false;

  constructor(
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService,
    private router: Router
  ) {
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

  protected async deleteRoute(routeId: number, modalCtx: any) {
    this.isDeleteRouteLoading = true;
    try {
      await firstValueFrom(this.airlineFetchService.deleteRoute(routeId));
      this.routes = this.routes.filter((route) => route.id !== routeId);
    } catch (error: any) {
      console.error('error deleting route', error);

      // Check if the error is a 409 Conflict
      if (error?.status === 409) {
        toast('Cannot delete this element', {
          description:
            'This route cannot be deleted because it is currently in use.',
        });
      } else {
        toast('Unknown error', {
          description: 'An unexpected error occurred while deleting the route.',
        });
      }
    } finally {
      this.isDeleteRouteLoading = false;
      modalCtx.close();
    }
  }
}
