// extras-list.component.ts
import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgOptimizedImage} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {HlmCheckboxComponent} from '@spartan-ng/ui-checkbox-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmTableComponent, HlmTrowComponent, HlmThComponent } from '@spartan-ng/ui-table-helm';
import { lucideEllipsis } from '@ng-icons/lucide';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import { IExtra } from '@/types/airline/extra';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { firstValueFrom } from 'rxjs';


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
    PopoverTriggerDirective
  ]
})
export class ExtrasListComponent {
  // The list of extras
  protected extras: IExtra[] = [];

  constructor(private airlineFetchService: AirlineFetchService, private loadingService: LoadingService) {
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
  editableExtra: IExtra = { id: '', name: '', description: '', airline_id: '', stackable: false };
  // Index of the extra being edited; null if adding new
  editingIndex: number | null = null;
  // Controls the visibility of the modal
  showModal = false;

  // Open the modal for adding a new extra
  openModalForNew() {
    this.editingIndex = null;
    this.editableExtra = { id: '', name: '', description: '', airline_id: '', stackable: false };
    this.showModal = true;
  }

  // Open the modal for editing an existing extra
  openModalForEdit(index: number) {
    this.editingIndex = index;
    // Create a copy so we don't mutate the list until saving
    this.editableExtra = { ...this.extras[index] };
    this.showModal = true;
  }

  // Close the modal without saving changes
  closeModal() {
    this.showModal = false;
  }

  // Save the new or edited extra back into the list
  saveExtra() {
    const extraCopy: IExtra = {
      name: this.editableExtra.name.trim(),
      description: this.editableExtra.description.trim(),
      stackable: this.editableExtra.stackable,
      airline_id: this.editableExtra.airline_id,
      id: this.editableExtra.id,
    };

    if (!extraCopy.name) {
      // Simple validation: require a name
      return;
    }

    if (this.editingIndex === null) {
      // Adding a new extra
      this.extras.push(extraCopy);
    } else {
      // Updating an existing extra
      this.extras[this.editingIndex] = extraCopy;
    }

    this.closeModal();
  }
}
