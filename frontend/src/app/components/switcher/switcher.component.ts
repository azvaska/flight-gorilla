import { Component, Input } from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-switcher',
  templateUrl: './switcher.component.html',
  imports: [
    NgClass
  ],
  // make <app-switcher> an inline grid with one cell
  host: {
    'class': 'inline-grid grid-rows-1 grid-cols-1'
  }
})
export class SwitcherComponent {
  /** when true, show the [active] slot; when false, show [inactive] */
  @Input() isActive = false;
}
