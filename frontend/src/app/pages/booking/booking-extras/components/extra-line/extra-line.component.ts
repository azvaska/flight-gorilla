import { Component, Input, Output, EventEmitter } from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';

@Component({
  selector: 'extra-line',
  standalone: true,
  imports: [
    NgIf,
    HlmCheckboxComponent,
    NgClass,
  ],
  templateUrl: './extra-line.component.html',
  styleUrls: ['./extra-line.component.css'],
})
export class ExtraLineComponent {
  /** configurations */
  @Input() title = '';
  @Input() description = '';
  @Input() isStackable = false;
  @Input() price = 0;
  @Input() limit: number = 0;

  /** two-way bindings */
  @Input() quantity = 0;
  @Output() quantityChange = new EventEmitter<number>();
  
  protected isSelected = false;
  /** visual state */
  get isActive() {
    return this.isStackable
      ? this.quantity > 0
      : this.isSelected;
  }

  increment() {
    if(this.limit > 0 && this.quantity >= this.limit) {
      //TODO: Show a toast or something like that
      return;
    }

    this.quantity++;
    this.quantityChange.emit(this.quantity);
    if (!this.isSelected) {
      this.isSelected = true;
    }
  }

  decrement() {
    if (this.quantity > 0) {
      this.quantity--;
      this.quantityChange.emit(this.quantity);
      if (this.quantity === 0) {
        this.isSelected = false;
      }
    }
  }

  toggleCheckbox(checked: boolean | "indeterminate") {
    if(checked === "indeterminate") {
      return;
    }

    if(checked) {
      this.quantity = 1;
      this.quantityChange.emit(this.quantity);
    } else {
      this.quantity = 0;
      this.quantityChange.emit(this.quantity);
    }
  }
}
