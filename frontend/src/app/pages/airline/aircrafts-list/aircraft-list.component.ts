import { Component } from '@angular/core';
import {NgForOf, NgOptimizedImage} from '@angular/common';

export interface Aircraft {
  id: string;
  model: string;
  tailNumber: string;
  seats: number;
}

@Component({
  selector: 'app-aircrafts-list',
  templateUrl: './aircraft-list.component.html',
  imports: [
    NgForOf,
    NgOptimizedImage
  ],
  host: {
    class: 'block w-full h-fit',
  },
})
export class AircraftListComponent {
  // Dummy data for demonstration purposes
  aircrafts: Aircraft[] = [
    { id: '0', model: 'Boeing 737', tailNumber: 'N12345', seats: 180 },
    { id: '1', model: 'Airbus A320', tailNumber: 'F-GKXB', seats: 150 },
    { id: '2', model: 'Cessna 172', tailNumber: 'G-ABCD', seats: 4 },
  ];

  constructor() {
    // duplicate 5 times the first element in "aircraft" array
    let newAircrafts = Array(5).fill(this.aircrafts[0]);
    this.aircrafts = [...this.aircrafts, ...newAircrafts, ...newAircrafts];

  }
}
