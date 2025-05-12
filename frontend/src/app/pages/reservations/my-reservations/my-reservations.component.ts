// src/app/my-reservations/my-reservations.component.ts
import { Component } from '@angular/core';
import {NgForOf, NgIf, SlicePipe} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {ActivatedRoute, Router} from '@angular/router';

interface FlightSegment {
  departureAirport: string;
  arrivalAirport:   string;
  departureTime:    string; // e.g. "08:00"
  arrivalTime:      string; // e.g. "10:00"
}

interface Reservation {
  id: number;
  name: string; // e.g. "Venice to Dublin"
  segments: FlightSegment[];  // [0] = outbound, [1] = return (if any)
}

@Component({
  selector: 'app-my-reservations',
  imports: [
    NgIf,
    NgForOf,
    SlicePipe,
    HlmButtonDirective
  ],
  host: {
    class: 'block w-full h-full',
  },
  templateUrl: './my-reservations.component.html'
})
export class MyReservationsComponent {
  reservations: Reservation[] = [
    {
      id: 1,
      name: 'Venice to Dublin',
      segments: [
        { departureAirport: 'VCE', arrivalAirport: 'CDG', departureTime: '08:00', arrivalTime: '10:00' },
        { departureAirport: 'CDG', arrivalAirport: 'DUB', departureTime: '12:00', arrivalTime: '13:30' }
      ]
    },
    {
      id: 2,
      name: 'London to New York',
      segments: [
        { departureAirport: 'LHR', arrivalAirport: 'JFK', departureTime: '09:00', arrivalTime: '12:30' }
      ]
    }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  modifyDateReservation(resId: number) {
    console.log(`Modify date for reservation ${resId}`);
    // TODO: open date-picker...
  }

  modifyExtrasReservation(resId: number) {
    console.log(`Modify extras for reservation ${resId}`);
    // TODO: extras dialog...
  }

  cancelReservation(resId: number) {
    // noinspection JSIgnoredPromiseFromCall
    this.router.navigate(['../cancel-reservation'], { relativeTo: this.route })
  }
}
