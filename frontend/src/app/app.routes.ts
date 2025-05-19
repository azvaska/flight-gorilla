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
import { Booking1OverviewComponent } from '@/app/pages/booking/booking1-overview/booking1-overview.component';
import { Booking2SeatsComponent } from '@/app/pages/booking/booking2-seats/booking2-seats.component';
import { Booking3ExtraComponent } from '@/app/pages/booking/booking3-extra/booking3-extra.component';
import { LoginComponent } from '@/app/pages/auth/login/login.component';
import { RegisterComponent } from '@/app/pages/auth/register/register.component';
import {Booking4PaymentComponent} from '@/app/pages/booking/booking4-payment/booking4-payment.component';
import {Booking5ConfirmationComponent} from '@/app/pages/booking/booking5-confirmation/booking5-confirmation.component';
import {Booking5ErrorComponent} from '@/app/pages/booking/booking5-error/booking5-error.component';
import { AuthGuard, GuestGuard } from './auth/auth.guard';
import {MyReservationsComponent} from '@/app/pages/reservations/my-reservations/my-reservations.component';
import {CancelReservationComponent} from '@/app/pages/reservations/cancel-reservation/cancel-reservation.component';
import {MyProfileComponent} from '@/app/pages/my-profile/my-profile.component';
import {CreditCardListComponent} from '@/app/components/credit-card-list/credit-card-list.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'auth',
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
        component: Booking1OverviewComponent,
        data: { selectedNumber: 1 },
      },
      {
        path: 'seats',
        component: Booking2SeatsComponent,
        data: { selectedNumber: 2 },
      },
      {
        path: 'extras',
        component: Booking3ExtraComponent,
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
    path: 'reservations',
    canActivate: [AuthGuard],
    component: MyReservationsComponent
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
