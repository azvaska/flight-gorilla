import { Routes } from '@angular/router';
import { LandingPageComponent } from '@/app/pages/landing-page/landing-page.component';
import { SearchComponent } from '@/app/pages/search/search.component';
import { SearchCountryComponent } from '@/app/pages/search/search-country/search-country.component';
import { SearchCityComponent } from '@/app/pages/search/search-city/search-city.component';
import { SearchDatesComponent } from '@/app/pages/search/search-dates/search-dates.component';
import { SearchFlightsComponent } from '@/app/pages/search/search-flights/search-flights.component';
import { NotFoundComponent } from '@/app/pages/not-found/not-found.component';
import { SearchParamsGuard, SearchRedirectGuard } from './guards/search-guard';

import { BookingComponent } from '@/app/pages/booking/booking.component';
import { BookingOverviewComponent } from '@/app/pages/booking/booking-overview/booking-overview.component';
import { BookingSeatsComponent } from '@/app/pages/booking/booking-seats/booking-seats.component';
import { BookingExtrasComponent } from '@/app/pages/booking/booking-extras/booking-extras.component';
import { LoginComponent } from '@/app/pages/auth/login/login.component';
import { RegisterComponent } from '@/app/pages/auth/register/register.component';
import {Booking4PaymentComponent} from '@/app/pages/booking/booking4-payment/booking4-payment.component';
import {Booking5ConfirmationComponent} from '@/app/pages/booking/booking5-confirmation/booking5-confirmation.component';
import {Booking5ErrorComponent} from '@/app/pages/booking/booking5-error/booking5-error.component';
import { AuthGuard, GuestGuard } from './auth/auth.guard';
import {BookingsComponent} from '@/app/pages/user/bookings/bookings.component';
import {CancelReservationComponent} from '@/app/pages/user/bookings/cancel-reservation/cancel-reservation.component';
import {MyProfileComponent} from '@/app/pages/user/my-profile/my-profile.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'auth',
    canActivate: [GuestGuard],
    children: [
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
    ],
  },
  {
    path: 'search',
    component: SearchComponent,
    canActivate: [SearchRedirectGuard],
    canActivateChild: [SearchParamsGuard],
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'nation',
        component: SearchCountryComponent,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },
      {
        path: 'city',
        component: SearchCityComponent,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },
      {
        path: 'dates',
        component: SearchDatesComponent,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },
      {
        path: 'flights',
        component: SearchFlightsComponent,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },
    ],
  },
  {
    path: 'booking',
    component: BookingComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'overview',
        component: BookingOverviewComponent,
        data: { selectedNumber: 1 },
      },
      {
        path: 'seats',
        component: BookingSeatsComponent,
        data: { selectedNumber: 2 },
      },
      {
        path: 'extras',
        component: BookingExtrasComponent,
        data: { selectedNumber: 3 },
      },
      {
        path: 'payment',
        component: Booking4PaymentComponent,
        data: { selectedNumber: 4 },
      },
      {
        path: 'confirmed',
        component: Booking5ConfirmationComponent,
        data: { selectedNumber: 5 },
      },
      {
        path: 'error',
        component: Booking5ErrorComponent,
        data: { selectedNumber: 5 },
      }
    ],
  },
  {
    path: 'bookings',
    canActivate: [AuthGuard],
    component: BookingsComponent
  },
  {
    path: 'profile',
    component: MyProfileComponent,
  },
  {
    path: 'cancel-reservation',
    canActivate: [AuthGuard],
    component: CancelReservationComponent
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
