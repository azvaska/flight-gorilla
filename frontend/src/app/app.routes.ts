import { Routes } from '@angular/router';
import { LandingPageComponent } from '@/app/pages/landing-page/landing-page.component';
import { SearchComponent } from '@/app/pages/search/search.component';
import { SearchCountryComponent } from '@/app/pages/search/search-country/search-country.component';
import { SearchCityComponent } from '@/app/pages/search/search-city/search-city.component';
import { SearchDatesComponent } from '@/app/pages/search/search-dates/search-dates.component';
import { SearchFlightsComponent } from '@/app/pages/search/search-flights/search-flights.component';
import { NotFoundComponent } from '@/app/pages/not-found/not-found.component';
import { SearchParamsGuard, SearchRedirectGuard } from './guards/search-guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: "search",
    component: SearchComponent,
    canActivate: [SearchRedirectGuard],
    canActivateChild: [SearchParamsGuard],
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'country',
        component: SearchCountryComponent,
      },
      {
        path: 'city',
        component: SearchCityComponent,
      },
      {
        path: 'dates',
        component: SearchDatesComponent,
      },
      {
        path: 'flights',
        component: SearchFlightsComponent,
      },
    ],
  },
  {
    path: '404',
    component: NotFoundComponent,
  },
];

