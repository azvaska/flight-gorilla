import { Component, Input, Output, EventEmitter } from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';

@Component({
  selector: 'app-extra-line',
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
  /** two-way bindings */
  @Input() quantity = 0;
  @Output() quantityChange = new EventEmitter<number>();
  @Input() selected = false;
  @Output() selectedChange  = new EventEmitter<boolean>();

  /** visual state */
  get isActive() {
    return this.isStackable
      ? this.quantity > 0
      : this.selected;
  }

  increment() {
    this.quantity++;
    this.quantityChange.emit(this.quantity);
    if (!this.selected) {
      this.selected = true;
      this.selectedChange.emit(true);
    }
  }

  decrement() {
    if (this.quantity > 0) {
      this.quantity--;
      this.quantityChange.emit(this.quantity);
      if (this.quantity === 0) {
        this.selected = false;
        this.selectedChange.emit(false);
      }
    }
  }

  toggleCheckbox() {
    console.log("amongas");
    this.selected = !this.selected;
    this.selectedChange.emit(this.selected);
  }
}
