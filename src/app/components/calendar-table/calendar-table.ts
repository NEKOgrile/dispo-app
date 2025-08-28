import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- IMPORTANT

interface Day {
  date: Date;
  users: { name: string; color: string }[];
}

@Component({
    imports: [CommonModule], // <-- il faut importer CommonModule ici aussi

  selector: 'app-calendar-table',
  standalone: true,
  template: `
    <div class="calendar-grid">
      <div *ngFor="let day of days" class="calendar-cell" (click)="toggleUser(day)">
        {{ day.date.getDate() }}
        <span *ngFor="let user of day.users" class="user-dot" [style.background-color]="user.color" [title]="user.name"></span>
      </div>
    </div>
  `,
  styles: [`
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .calendar-cell { background: rgba(255,255,255,0.03); border-radius: 12px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
    .user-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; }
  `]
})

export class CalendarTableComponent {
  @Input() days: Day[] = [];
  @Input() selectedUser = { name: 'Enora', color: 'green' };

  toggleUser(day: Day) {
    const exists = day.users.find(u => u.name === this.selectedUser.name);
    if (exists) {
      day.users = day.users.filter(u => u.name !== this.selectedUser.name);
    } else {
      day.users.push({ ...this.selectedUser });
    }
  }
}
