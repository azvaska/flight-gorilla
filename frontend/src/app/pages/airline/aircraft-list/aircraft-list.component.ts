import { Component } from '@angular/core';
import {NgForOf, NgOptimizedImage} from '@angular/common';
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
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IAircraft, IAirlineAircraft
 } from '@/types/airline/aircraft';
import { firstValueFrom, Observable } from 'rxjs';

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
  protected aircrafts: IAirlineAircraft[] = [];

  constructor(private airlineFetchService: AirlineFetchService, private loadingService: LoadingService) {
    this.fetchAircrafts().then((aircrafts) => {
      this.aircrafts = aircrafts;
    });
  }
  
  protected async fetchAircrafts() {
    this.loadingService.startLoadingTask();
    const aircrafts = await firstValueFrom(this.airlineFetchService.getAircrafts());
    this.loadingService.endLoadingTask();
    return aircrafts;
  }
}


