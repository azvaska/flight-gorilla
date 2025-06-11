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
import { BookingsComponent } from '@/app/pages/user/bookings/bookings.component';
import { UserProfileComponent } from '@/app/pages/user/profile/profile.component';
import { AircraftListComponent } from '@/app/pages/airline/aircraft-list/aircraft-list.component';
import { AircraftAddComponent } from '@/app/pages/airline/aircraft-add/aircraft-add.component';
import { AircraftDetailsComponent } from '@/app/pages/airline/aircraft-details/aircraft-details.component';
import { FlightDetailsComponent } from '@/app/pages/airline/flight-details/flight-details.component';
import { RouteListComponent } from '@/app/pages/airline/route-list/route-list.component';
import { RouteAddComponent } from './pages/airline/route-add/route-add.component';
import { FlightsListComponent } from '@/app/pages/airline/flights-list/flights-list.component';
import { FlightsAddComponent } from '@/app/pages/airline/flights-add/flights-add.component';
import { ExtrasListComponent } from '@/app/pages/airline/extras-list/extras-list.component';
import { AirlineProfileComponent } from '@/app/pages/airline/airline-profile/airline-profile.component';
import { BookingDetailsComponent } from './pages/user/bookings/booking-details/booking-details.component';
import { BookingCancelledComponent } from './pages/user/bookings/booking-cancelled/booking-cancelled.component';
import { SidebarComponent as AirlineSidebarComponent } from './components/airline/sidebar/sidebar.component';
import { RouteDetailsComponent } from './pages/airline/route-details/route-details.component';
import { AdminSidebarComponent } from './components/admin/sidebar/sidebar.component';
import { UsersListComponent } from './pages/admin/users-list/users-list.component';
import { AirlinesListComponent } from './pages/admin/airlines-list/airlines-list.component';
import { AirlineAddComponent as AdminAirlineAddComponent } from './pages/admin/airline-add/airline-add.component';
import { RoleGuard, MultipleMatchingRoleGuard } from './guards/role-access.guard';

export const routes: Routes = [
  {
    path: '',
    component: UserLandingPage,
    canMatch: [MultipleMatchingRoleGuard],
    data: { roles: ['guest', 'user'] },
  },
  {
    path: '',
    component: AirlineSidebarComponent,
    canMatch: [MultipleMatchingRoleGuard],
    data: { roles: ['airline-admin'] },
    children: [
      {
        path: '',
        data: { pageTitle: 'Home' },
        component: AirlineLandingPage,
      },
      {
        path: 'airline',
        data: { pageTitle: 'Airline Profile' },
        component: AirlineProfileComponent,
      },
      {
        path: 'aircraft',
        data: { pageTitle: 'Aircraft Management' },
        component: AircraftListComponent,
      },
      {
        path: 'routes',
        data: { pageTitle: 'Route Management' },
        component: RouteListComponent,
      },
      {
        path: 'flights',
        data: { pageTitle: 'Flight Management' },
        component: FlightsListComponent,
      },
      {
        path: 'extras',
        data: { pageTitle: 'Extra Management' },
        component: ExtrasListComponent,
      },
    ],
  },
  {
    path: 'aircraft/add',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: AircraftAddComponent,
  },
  {
    path: 'aircraft/edit/:aircraftId',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: AircraftAddComponent,
  },
  {
    path: 'aircraft/:aircraftId',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: AircraftDetailsComponent,
  },
  {
    path: 'routes/add',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: RouteAddComponent,
  },
  {
    path: 'routes/edit/:routeId',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: RouteAddComponent,
  },
  {
    path: 'routes/:routeId',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: RouteDetailsComponent,
  },
  {
    path: 'flights/add',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: FlightsAddComponent,
  },
  {
    path: 'flights/edit/:flightId',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: FlightsAddComponent,
  },
  {
    path: 'flights/:flightId',
    canMatch: [RoleGuard],
    data: { roles: ['airline-admin'] },
    component: FlightDetailsComponent,
  },
  {
    path: '',
    component: AdminSidebarComponent,
    canMatch: [MultipleMatchingRoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        component: UsersListComponent,
        data: { pageTitle: 'User Management' },
      },
      {
        path: 'airlines',
        component: AirlinesListComponent,
        data: { pageTitle: 'Airline Management' },
      },
    ],
  },
  {
    path: 'airlines/add',
    component: AdminAirlineAddComponent,
    canMatch: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'auth',
    canMatch: [RoleGuard],
    data: { roles: ['guest'] },
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
    canMatch: [RoleGuard],
    canActivate: [SearchRedirectGuard],
    canActivateChild: [SearchParamsGuard],
    data: { roles: ['guest', 'user'] },
    runGuardsAndResolvers: 'always',
    children: [
      // {
      //   path: '',
      //   component: SearchComponent,
      // },
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
    canMatch: [RoleGuard],
    data: { roles: ['user'] },
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
    path: 'user',
    canMatch: [RoleGuard],
    data: { roles: ['user'] },
    children: [
      {
        path: 'bookings',
        component: BookingsComponent,
      },
      {
        path: 'bookings/cancelled',
        component: BookingCancelledComponent,
      },
      {
        path: 'bookings/:bookingId',
        component: BookingDetailsComponent,
      },
      {
        path: 'profile',
        component: UserProfileComponent,
      },
    ],
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];
