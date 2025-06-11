import { Component, OnInit } from '@angular/core'; // Import OnInit for lifecycle hook
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { ChartData, ChartEvent, ChartType, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {DecimalPipe} from '@angular/common';

// --- Interfaces for API Data ---
interface FlightFulfillmentData {
  month: number;
  totalSeats: number;
  totalBooks: number;
}

interface RevenueData {
  month: number;
  total: number;
}

interface MostRequestedRouteData {
  airportFrom: string;
  airportTo: string;
  flight_number: string;
  bookings: number;
}

interface AirportsWithMostFlightsData {
  airport: string;
  flights: number;
}

interface LeastUsedRouteData {
  airportFrom: string;
  airportTo: string;
  flight_number: string;
  flights: number;
}

interface DashboardData {
  flights_fullfilment: FlightFulfillmentData[];
  revenue: RevenueData[];
  mostRequestedRoutes: MostRequestedRouteData[];
  airportsWithMostFlights: AirportsWithMostFlightsData[];
  leastUsedRoute: LeastUsedRouteData[];
}

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

  // Mock data structure to simulate API response
  public dashboardData: DashboardData = {
    flights_fullfilment: [
      { month: 1, totalSeats: 2000, totalBooks: 1500 },
      { month: 2, totalSeats: 2100, totalBooks: 1650 },
      { month: 3, totalSeats: 2200, totalBooks: 1700 },
      { month: 4, totalSeats: 2300, totalBooks: 1850 },
      { month: 5, totalSeats: 2400, totalBooks: 1900 },
      { month: 6, totalSeats: 2500, totalBooks: 2000 },
      { month: 7, totalSeats: 2600, totalBooks: 2100 },
      { month: 8, totalSeats: 2700, totalBooks: 2200 },
      { month: 9, totalSeats: 2800, totalBooks: 2300 },
      { month: 10, totalSeats: 2900, totalBooks: 2400 },
      { month: 11, totalSeats: 3000, totalBooks: 2500 },
      { month: 12, totalSeats: 3100, totalBooks: 2600 }
    ],
    revenue: [
      { month: 1, total: 150000 },
      { month: 2, total: 165000 },
      { month: 3, total: 170000 },
      { month: 4, total: 185000 },
      { month: 5, total: 190000 },
      { month: 6, total: 200000 },
      { month: 7, total: 210000 },
      { month: 8, total: 220000 },
      { month: 9, total: 230000 },
      { month: 10, total: 240000 },
      { month: 11, total: 250000 },
      { month: 12, total: 260000 }
    ],
    mostRequestedRoutes: [
      { airportFrom: "JFK", airportTo: "LAX", flight_number: "AA101", bookings: 950 },
      { airportFrom: "LAX", airportTo: "ORD", flight_number: "UA202", bookings: 880 },
      { airportFrom: "ORD", airportTo: "DFW", flight_number: "DL303", bookings: 820 },
      { airportFrom: "DFW", airportTo: "DEN", flight_number: "WN404", bookings: 790 },
      { airportFrom: "DEN", airportTo: "SFO", flight_number: "AS505", bookings: 750 },
      { airportFrom: "SFO", airportTo: "SEA", flight_number: "VX606", bookings: 700 },
      { airportFrom: "SEA", airportTo: "ATL", flight_number: "DL707", bookings: 680 },
      { airportFrom: "ATL", airportTo: "CLT", flight_number: "AA808", bookings: 650 },
      { airportFrom: "CLT", airportTo: "LAS", flight_number: "WN909", bookings: 620 },
      { airportFrom: "LAS", airportTo: "MIA", flight_number: "AA010", bookings: 590 },
    ],
    airportsWithMostFlights: [
      { airport: "ATL", flights: 12000 },
      { airport: "DFW", flights: 11500 },
      { airport: "DEN", flights: 11000 },
      { airport: "ORD", flights: 10500 },
      { airport: "LAX", flights: 10000 },
      { airport: "JFK", flights: 9500 },
      { airport: "SFO", flights: 9000 },
      { airport: "SEA", flights: 8500 },
      { airport: "CLT", flights: 8000 },
      { airport: "LAS", flights: 7500 },
    ],
    leastUsedRoute: [
      { airportFrom: "MIA", airportTo: "BOS", flight_number: "AA100", flights: 120 },
      { airportFrom: "PHX", airportTo: "MSP", flight_number: "DL200", flights: 150 },
      { airportFrom: "EWR", airportTo: "IND", flight_number: "UA300", flights: 180 },
      { airportFrom: "STL", airportTo: "MCI", flight_number: "WN400", flights: 200 },
      { airportFrom: "CVG", airportTo: "BNA", flight_number: "AS500", flights: 230 },
      { airportFrom: "CLE", airportTo: "PIT", flight_number: "VX600", flights: 250 },
      { airportFrom: "BUF", airportTo: "SYR", flight_number: "DL700", flights: 280 },
      { airportFrom: "RDU", airportTo: "GSO", flight_number: "AA800", flights: 300 },
      { airportFrom: "OKC", airportTo: "TUL", flight_number: "WN900", flights: 320 },
      { airportFrom: "MEM", airportTo: "LIT", flight_number: "AA000", flights: 350 },
    ]
  };

  public months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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


  ngOnInit(): void {
    this.prepareChartData();
  }

  private prepareChartData(): void {
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
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
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
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)'
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
  private generateDistinctColors(count: number, alpha: number = 0.6, startHue: number = 0): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const hue = (startHue + (i * (360 / count))) % 360;
      colors.push(`hsla(${hue}, 70%, 60%, ${alpha})`);
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
