import { Routes } from '@angular/router';
import { LandingPageComponent as UserLandingPage } from '@/app/pages/landing-page/landing-page.component';
import { LandingPageComponent as AirlineLandingPage } from '@/app/pages/airline/landing-page/landing-page.component';
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
import { BookingPaymentComponent } from '@/app/pages/booking/booking-payment/booking-payment.component';
import { BookingConfirmationComponent } from '@/app/pages/booking/booking-confirmation/booking-confirmation.component';
import { BookingErrorComponent } from '@/app/pages/booking/booking-error/booking-error.component';
import { AuthGuard, GuestGuard } from './auth/auth.guard';
import { BookingsComponent } from '@/app/pages/user/bookings/bookings.component';
import { BookingCancelledComponent } from '@/app/pages/user/bookings/booking-cancelled/booking-cancelled.component';
import { MyProfileComponent } from '@/app/pages/user/my-profile/my-profile.component';
import { BookingDetailsComponent } from './pages/user/bookings/booking-details/booking-details.component';
import { AircraftListComponent } from '@/app/pages/airline/aircraft-list/aircraft-list.component';
import {AircraftAddComponent} from '@/app/pages/airline/aircraft-add/aircraft-add.component';

export const routes: Routes = [
  {
    path: '',
    component: UserLandingPage,
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
        component: BookingPaymentComponent,
        data: { selectedNumber: 4 },
      },
      {
        path: 'confirmed',
        component: BookingConfirmationComponent,
        data: { selectedNumber: 5 },
      },
      {
        path: 'error',
        component: BookingErrorComponent,
        data: { selectedNumber: 5 },
      },
    ],
  },
  {
    path: 'airlines',
    component: AirlineLandingPage,
  },
  {
    path: 'manage-aircraft',
    component: AircraftListComponent
  },
  {
    path: 'manage-aircraft/add',
    component: AircraftAddComponent,
  },
  {
    path: 'bookings',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: BookingsComponent,
      },
      {
        path: 'cancelled',
        component: BookingCancelledComponent,
      },
      {
        path: ':bookingId',
        component: BookingDetailsComponent,
      },
    ],
  },

  {
    path: 'profile',
    component: MyProfileComponent,
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
