import { Component } from '@angular/core';
import { CalendarGridComponent } from '../../components/calendar-grid/calendar-grid';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CalendarGridComponent],   // ✅ ici ça marche si CalendarGridComponent est standalone
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  user: any;
  travelTime: string = '';
}
