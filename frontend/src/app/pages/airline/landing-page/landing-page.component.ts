import { Component, OnInit } from '@angular/core'; // Import OnInit for lifecycle hook
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { ChartData, ChartEvent, ChartType, ChartOptions } from 'chart.js';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { BaseChartDirective } from 'ng2-charts';
import {DecimalPipe} from '@angular/common';
import {IStats} from '@/types/airline/stats'; // Import IStats
import { LoadingService } from '@/app/services/loading.service';
import { firstValueFrom } from 'rxjs';
import {hexToRgba} from '@/utils/colors';


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  imports: [
    HlmCardDirective,
    BaseChartDirective,
    DecimalPipe
  ],
  host: {
    class: 'block w-full h-fit',
  },
})
export class LandingPageComponent implements OnInit { // Implement OnInit

  public dashboardData: IStats | undefined;
  public months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private colorPalette: string[] = [
    '#343e3d', // Palette Color 1
    '#607466', // Palette Color 2
    '#aedcc0', // Palette Color 3 (Black)
    '#7bd389', // Palette Color 4
    '#38e4ae'  // Palette Color 5
  ];

  constructor(
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {} // Constructor modified to fetch data in ngOnInit instead

  ngOnInit(): void {
    // Fetch data and then prepare charts
    this.fetchStats().then((response) => {
      this.dashboardData = response;
      this.prepareChartData(); // Call prepareChartData AFTER dashboardData is set
      console.log('Dashboard Data:', this.dashboardData);
    });
  }

  protected async fetchStats(){
    this.loadingService.startLoadingTask();
    const response = await firstValueFrom(
      this.airlineFetchService.getAirlineStats()
    );
    this.loadingService.endLoadingTask();
    return response;
  }

  // Common chart options for hiding legend and responsiveness
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow charts to adapt to container size
    plugins: {
      legend: {
        display: false // Hide the legend for all charts as per request
      }
    }
  };

  // --- Flights Fulfillment Chart (Line Chart) ---
  public flightsFulfillmentLabels: string[] = [];
  public flightsFulfillmentData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  public flightsFulfillmentType: ChartType = 'line';

  // --- Periodic Revenue Chart (Line Chart) ---
  public periodicRevenueLabels: string[] = [];
  public periodicRevenueData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  public periodicRevenueType: ChartType = 'line';

  // --- Total Revenue (Non-graph) ---
  public totalRevenue: number = 0;

  // --- Most Requested Routes Chart (Bar Chart) ---
  public mostRequestedRoutesLabels: string[] = [];
  public mostRequestedRoutesData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  public mostRequestedRoutesType: ChartType = 'bar';

  // --- Airports with Most Flights Chart (Bar Chart) ---
  public airportsWithMostFlightsLabels: string[] = [];
  public airportsWithMostFlightsData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  public airportsWithMostFlightsType: ChartType = 'bar';

  // --- Least Used Routes Chart (Bar Chart) ---
  public leastUsedRoutesLabels: string[] = [];
  public leastUsedRoutesData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  public leastUsedRoutesType: ChartType = 'bar';


  private prepareChartData(): void {
    // Ensure dashboardData is not undefined before accessing its properties
    if (!this.dashboardData) {
      console.error('Dashboard data is not available.');
      return;
    }

    // Flights Fulfillment
    this.flightsFulfillmentLabels = this.dashboardData.flights_fullfilment
      .sort((a, b) => a.month - b.month)
      .map(item => this.months[item.month - 1]);
    this.flightsFulfillmentData = {
      labels: this.flightsFulfillmentLabels,
      datasets: [
        {
          data: this.dashboardData.flights_fullfilment
            .sort((a, b) => a.month - b.month)
            .map(item => (item.totalBooks / item.totalSeats) * 100),
          label: 'Fulfillment %',
          fill: true,
          tension: 0.4,
          borderColor: this.colorPalette[1],
          backgroundColor: hexToRgba(this.colorPalette[1], 0.2),
        }
      ]
    };

    // Periodic Revenue
    this.periodicRevenueLabels = this.dashboardData.revenue
      .sort((a, b) => a.month - b.month)
      .map(item => this.months[item.month - 1]);
    this.periodicRevenueData = {
      labels: this.periodicRevenueLabels,
      datasets: [
        {
          data: this.dashboardData.revenue
            .sort((a, b) => a.month - b.month)
            .map(item => item.total),
          label: 'Revenue (€)',
          fill: true,
          tension: 0.4,
          borderColor: this.colorPalette[0],
          backgroundColor: hexToRgba(this.colorPalette[0], 0.2),
        }
      ]
    };
    this.totalRevenue = this.dashboardData.revenue.reduce((sum, item) => sum + item.total, 0);

    // Most Requested Routes
    this.mostRequestedRoutesLabels = this.dashboardData.mostRequestedRoutes.map(
      route => `${route.airportFrom}-${route.airportTo}`
    );
    this.mostRequestedRoutesData = {
      labels: this.mostRequestedRoutesLabels,
      datasets: [
        {
          data: this.dashboardData.mostRequestedRoutes.map(route => route.bookings),
          backgroundColor: this.generateDistinctColors(this.dashboardData.mostRequestedRoutes.length),
          borderColor: this.generateDistinctColors(this.dashboardData.mostRequestedRoutes.length, 0.8),
          borderWidth: 1
        }
      ]
    };

    // Airports with Most Flights
    this.airportsWithMostFlightsLabels = this.dashboardData.airportsWithMostFlights.map(
      airport => airport.airport
    );
    this.airportsWithMostFlightsData = {
      labels: this.airportsWithMostFlightsLabels,
      datasets: [
        {
          data: this.dashboardData.airportsWithMostFlights.map(airport => airport.flights),
          backgroundColor: this.generateDistinctColors(this.dashboardData.airportsWithMostFlights.length),
          borderColor: this.generateDistinctColors(this.dashboardData.airportsWithMostFlights.length, 0.8),
          borderWidth: 1
        }
      ]
    };

    // Least Used Routes
    this.leastUsedRoutesLabels = this.dashboardData.leastUsedRoute.map(
      route => `${route.airportFrom}-${route.airportTo}`
    );
    this.leastUsedRoutesData = {
      labels: this.leastUsedRoutesLabels,
      datasets: [
        {
          data: this.dashboardData.leastUsedRoute.map(route => route.flights),
          backgroundColor: this.generateDistinctColors(this.dashboardData.leastUsedRoute.length, 0.6, 0.4), // Different hue for distinction
          borderColor: this.generateDistinctColors(this.dashboardData.leastUsedRoute.length, 0.8, 0.4),
          borderWidth: 1
        }
      ]
    };
  }

  // Helper to generate distinct colors for bar charts
  private generateDistinctColors(count: number, alpha: number = 0.6, startIndex: number = 0): string[] {
    const colors: string[] = [];
    const paletteLength = this.colorPalette.length;
    for (let i = 0; i < count; i++) {
      // Cycle through the palette, starting from startIndex
      const hexColor = this.colorPalette[(startIndex + i) % paletteLength];
      colors.push(hexToRgba(hexColor, alpha));
    }
    return colors;
  }

  // Generic chart event handlers for all charts
  public chartClicked({ event, active }: { event: ChartEvent; active: object[]; }): void {
    console.log('Chart Clicked:', event, active);
  }

  public chartHovered({ event, active }: { event: ChartEvent; active: object[]; }): void {
    console.log('Chart Hovered:', event, active);
  }
}
