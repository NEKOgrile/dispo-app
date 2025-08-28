// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // ✅ import correct
import { AppComponent } from './app/app';
import { LoginComponent } from './app/pages/login/login';
import { DashboardComponent } from './app/pages/dashboard/dashboard';
import { CalendarGridComponent } from './app/components/calendar-grid/calendar-grid';

// Typage explicite du tableau de routes
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'calendar', component: CalendarGridComponent },
];

// Bootstrap de l'application avec le router et HttpClient
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient()    // <-- il faut appeler la fonction ici, dans le tableau providers
  ]
});
