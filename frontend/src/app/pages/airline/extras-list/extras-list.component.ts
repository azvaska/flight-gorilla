// extras-list.component.ts
import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgOptimizedImage} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {HlmCheckboxComponent} from '@spartan-ng/ui-checkbox-helm';

interface Extra {
  name: string;
  description: string;
  stackable: boolean;
}

@Component({
  selector: 'app-extras-list',
  templateUrl: './extras-list.component.html',
  imports: [
    FormsModule,
    NgClass,
    NgForOf,
    NgOptimizedImage,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmCheckboxComponent
  ]
})
export class ExtrasListComponent {
  // The list of extras
  extras: Extra[] = [
    // You can initialize with some sample data or leave empty
    { name: 'WiFi', description: 'In-flight internet access', stackable: false },
    { name: 'Extra Legroom', description: 'Seat with extra legroom', stackable: true },
  ];

  // Holds the extra being added/edited
  editableExtra: Extra = { name: '', description: '', stackable: false };
  // Index of the extra being edited; null if adding new
  editingIndex: number | null = null;
  // Controls the visibility of the modal
  showModal = false;

  // Open the modal for adding a new extra
  openModalForNew() {
    this.editingIndex = null;
    this.editableExtra = { name: '', description: '', stackable: false };
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
    const extraCopy: Extra = {
      name: this.editableExtra.name.trim(),
      description: this.editableExtra.description.trim(),
      stackable: this.editableExtra.stackable,
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
