
import { Component, QueryList, ViewChild, viewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf, NgOptimizedImage, NgIf } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import {
  HlmTableComponent,
  HlmTrowComponent,
  HlmThComponent,
} from '@spartan-ng/ui-table-helm';
import { lucideEllipsis } from '@ng-icons/lucide';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import { IExtra } from '@/types/airline/extra';
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


@Component({
  selector: 'app-extras-list',
  standalone: true,
  templateUrl: './extras-list.component.html',
  providers: [provideIcons({ lucideEllipsis })],
  host: { class: 'block w-full h-fit' },
  imports: [
    FormsModule,
    NgClass,
    NgForOf,
    NgOptimizedImage,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmCheckboxComponent,
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
    HlmToasterComponent,
    NgIf,
  ],
})
export class ExtrasListComponent {
  // The list of extras
  protected extras: IExtra[] = [];

  protected isLoading = false;
  protected isDeleteExtraLoading = false;
  protected modalError: string | null = null;

  @ViewChildren('popover') public popovers!: QueryList<PopoverComponent>;

  constructor(
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {
    this.fetchExtras().then((extras) => {
      this.extras = extras;
    });
  }

  private async fetchExtras() {
    this.loadingService.startLoadingTask();
    const extras = await firstValueFrom(this.airlineFetchService.getExtras());
    this.loadingService.endLoadingTask();
    return extras;
  }

  // Holds the extra being added/edited
  editableExtra: IExtra = {
    id: '',
    name: '',
    description: '',
    airline_id: '',
    stackable: false,
  };
  // Index of the extra being edited; null if adding new
  editingIndex: number | null = null;
  // Controls the visibility of the modal
  showModal = false;

  // Open the modal for adding a new extra
  openModalForNew() {
    this.editingIndex = null;
    this.editableExtra = {
      id: '',
      name: '',
      description: '',
      airline_id: '',
      stackable: false,
    };
    this.modalError = null;
    this.showModal = true;
  }

  // Open the modal for editing an existing extra
  openModalForEdit(index: number) {
    this.popovers.get(index)?.close();
    this.editingIndex = index;
    // Create a copy so we don't mutate the list until saving
    this.editableExtra = { ...this.extras[index] };
    this.modalError = null;
    this.showModal = true;
  }

  // Close the modal without saving changes
  closeModal() {
    this.showModal = false;
    this.modalError = null;
  }

  // Save the new or edited extra back into the list
  protected async saveExtra() {
    const extraCopy: IExtra = {
      name: this.editableExtra.name.trim(),
      description: this.editableExtra.description.trim(),
      stackable: this.editableExtra.stackable,
      airline_id: this.editableExtra.airline_id,
      id: this.editableExtra.id,
    };

    this.isLoading = true;
    this.modalError = null;

    try {
      if (this.editingIndex === null) {
        const extra = await firstValueFrom(
          this.airlineFetchService.addExtra({
            name: this.editableExtra.name.trim(),
            description: this.editableExtra.description.trim(),
            required_on_all_segments: false,
            stackable: extraCopy.stackable,
          })
        );
        this.extras.push(extra);
      } else {
        await firstValueFrom(
          this.airlineFetchService.updateExtra(
            this.extras[this.editingIndex].id,
            {
              name: this.editableExtra.name.trim(),
              description: this.editableExtra.description.trim(),
              required_on_all_segments: false,
              stackable: extraCopy.stackable,
            }
          )
        );
        this.extras[this.editingIndex] = extraCopy;
      }
      this.closeModal();
    } catch (error: any) {
      console.error('Error saving extra:', error);
      this.modalError = 'Unknown error';
    } finally {
      this.isLoading = false;
    }
  }

  protected async deleteExtra(extraId: string, modalCtx: any) {
    this.isDeleteExtraLoading = true;
    try {
      await firstValueFrom(this.airlineFetchService.deleteExtra(extraId));
      this.extras = this.extras.filter((extra) => extra.id !== extraId);
    } catch (error: any) {
      console.error('error deleting extra', error);

      // Check if the error is a 409 Conflict
      if (error?.status === 409) {
        toast('Cannot delete this element', {
          description:
            'This extra cannot be deleted because it is currently in use.',
        });
      } else {
        toast('Unknown error', {
          description: 'An unexpected error occurred while deleting the extra.',
        });
      }
    } finally {
      this.isDeleteExtraLoading = false;
      modalCtx.close();
    }
  }
}
