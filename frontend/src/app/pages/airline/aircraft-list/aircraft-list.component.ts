import { Component } from '@angular/core';
import {NgForOf, NgOptimizedImage} from '@angular/common';
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
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IAircraft, IAirlineAircraft
 } from '@/types/airline/aircraft';
import { firstValueFrom, Observable } from 'rxjs';
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
  host: {
    class: 'block w-full h-fit',
  },
})
export class AircraftListComponent {
  protected aircrafts: IAirlineAircraft[] = [];
  protected isDeleteAircraftLoading = false;

  constructor(
    private airlineFetchService: AirlineFetchService, 
    private loadingService: LoadingService,
    private router: Router
  ) {
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

  protected formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected async deleteAircraft(aircraftId: string, modalCtx: any) {
    this.isDeleteAircraftLoading = true;
    try {
      await firstValueFrom(this.airlineFetchService.deleteAircraft(aircraftId));
      this.aircrafts = this.aircrafts.filter((aircraft) => aircraft.id !== aircraftId);
    } catch (error) {
      console.error('error deleting aircraft');
    } finally {
      this.isDeleteAircraftLoading = false;
      modalCtx.close(); 
    }
  }
}


