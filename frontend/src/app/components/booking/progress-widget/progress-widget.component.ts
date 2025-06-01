import { Component } from '@angular/core';
import {NgClass, NgForOf} from '@angular/common';

@Component({
  selector: 'app-progress-widget',
  imports: [
    NgClass, NgForOf
  ],
  inputs: ['selectedNumber', "total"],
  templateUrl: './progress-widget.component.html'
})
export class ProgressWidgetComponent {
  selectedNumber!: number;
  total!: number;

  get numbers(): number[] {
    return Array.from({ length: this.total }, (_, i) => i + 1);
  }

  get gradientArray(): number[] {
    //Create array that divide number from 0 to 100 in total times
    return Array.from({ length: this.total }, (_, i) => i * (100 / this.total));
  }
}
