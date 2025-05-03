// src/app/components/flight-search-input/flight-search-input.component.ts
import { Component, ElementRef, ViewChild, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '../../ui/popover/popover-trigger.directive';

@Component({
  selector: 'flight-search-input',
  templateUrl: './flight-search-input.component.html',
  imports: [CommonModule, PopoverComponent, PopoverTriggerDirective],
})
export class FlightSearchInputComponent {
  @ViewChild('popover') popover!: PopoverComponent;
  @Input() placeHolder: string = "";

  flights = [
    "hello",
    "world",
    "test",
    "pxa",
    "heas",
    "world1",
  ]

  search = "";

  get filteredFlights() {
    return this.flights.filter(item => item.startsWith(this.search));
  }

  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value.length === 0) {
      this.popover.close();
      return;
    }
    this.search = input.value;
    this.popover.open();
  }
}
