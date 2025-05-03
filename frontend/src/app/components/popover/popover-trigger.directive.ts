import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[popover-trigger]',
  standalone: true,
})
export class PopoverTriggerDirective {
  constructor(public el: ElementRef) {}
}
