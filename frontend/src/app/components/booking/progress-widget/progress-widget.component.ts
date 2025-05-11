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

}
