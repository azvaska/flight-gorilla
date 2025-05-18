// src/app/my-reservations/my-reservations.component.ts
import { Component } from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage, NgTemplateOutlet, SlicePipe} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {ActivatedRoute, Router} from '@angular/router';

interface FlightSegment {
  departureAirport: string;
  arrivalAirport:   string;
  departureDate:    string; // e.g. "11 Jul 2025"
  departureTime:    string; // e.g. "08:00"
  arrivalDate:      string; // e.g. "11 Jul 2025"
  arrivalTime:      string; // e.g. "10:00"
}

interface Reservation {
  id: number;
  name: string;
  departure: FlightSegment[];
  return:   FlightSegment[];
}

@Component({
  selector: 'app-my-reservations',
  imports: [
    NgIf,
    NgForOf,
    HlmButtonDirective,
    NgTemplateOutlet,
    NgOptimizedImage
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
      departure: [
        {
          departureAirport: 'VCE', arrivalAirport: 'CDG',
          departureDate: '11 Jul 2025', departureTime: '08:00',
          arrivalDate:   '11 Jul 2025', arrivalTime:   '10:00'
        },
        {
          departureAirport: 'CDG', arrivalAirport: 'DUB',
          departureDate: '12 Jul 2025', departureTime: '12:00',
          arrivalDate:   '12 Jul 2025', arrivalTime:   '13:30'
        },
      ],
      return: [
        {
          departureAirport: 'DUB', arrivalAirport: 'CDG',
          departureDate: '18 Jul 2025', departureTime: '09:00',
          arrivalDate:   '18 Jul 2025', arrivalTime:   '10:00'
        },
        {
          departureAirport: 'CDG', arrivalAirport: 'VCE',
          departureDate: '18 Jul 2025', departureTime: '15:00',
          arrivalDate:   '18 Jul 2025', arrivalTime:   '19:30'
        },
      ]
    },
    {
      id: 2,
      name: 'London to New York',
      departure: [
        {
          departureAirport: 'LHR', arrivalAirport: 'JFK',
          departureDate: '20 Jul 2025', departureTime: '09:00',
          arrivalDate:   '20 Jul 2025', arrivalTime:   '12:30'
        }
      ],
      return: []
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
