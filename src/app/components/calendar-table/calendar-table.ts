import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Day {
  date: Date;
  users: { name: string; color: string }[];
}

@Component({
  imports: [CommonModule],
  selector: 'app-calendar-table',
  standalone: true,
  template: `
    <!-- Header des jours (aligné sur 7 colonnes) -->
    <div class="calendar-header-row" [style.gridTemplateColumns]="'repeat(7, 1fr)'">
      <div *ngFor="let lbl of headerLabels" class="calendar-header-cell">
        {{ lbl }}
      </div>
    </div>

    <!-- Grille des jours -->
    <div class="calendar-grid" [style.gridTemplateColumns]="'repeat(7, 1fr)'">
      <div *ngFor="let day of days" class="calendar-cell"
           (click)="onDayClick(day)">
        <div class="date-number">{{ day.date.getDate() }}</div>

        <!-- pastilles utilisateurs -->
        <div class="dots">
          <span *ngFor="let user of day.users"
                class="user-dot"
                [style.background-color]="user.color"
                [title]="user.name"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* header */
    .calendar-header-row {
      display: grid;
      gap: 8px;
      margin-bottom: 8px;
    }
    .calendar-header-cell {
      text-align: center;
      font-weight: 700;
      padding: 6px 4px;
      color: rgba(255,255,255,0.75);
      user-select: none;
      font-size: 0.9rem;
    }

    /* grid + cells (réutilise la logique : 7 colonnes) */
    .calendar-grid { display: grid; gap: 8px; }
    .calendar-cell {
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 160ms ease;
      padding: 6px;
    }
    .calendar-cell:hover {
      background: rgba(124,92,255,0.08);
      transform: translateY(-2px);
    }

    .date-number {
      font-size: 1.05rem;
      font-weight: 600;
      color: inherit;
    }

    .dots {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .user-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      box-shadow: 0 1px 0 rgba(0,0,0,0.25) inset;
    }

    /* responsive */
    @media (max-width: 420px) {
      .calendar-cell { height: 60px; }
      .calendar-header-cell { font-size: 0.8rem; }
    }
  `]
})
export class CalendarTableComponent implements OnChanges {
  @Input() days: Day[] = [];
  @Input() selectedUser = { name: '', color: '' };
  @Output() toggleDate = new EventEmitter<Date>();

  headerLabels: string[] = [];
  private readonly _weekdayShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['days']) {          // <- utilisation de la notation crochet
      this._computeHeaderLabels();
    }
  }

  private _computeHeaderLabels() {
    this.headerLabels = [];
    if (!this.days || this.days.length === 0) return;
    const firstWeekday = this.days[0].date.getDay();
    for (let i = 0; i < 7; i++) {
      const idx = (firstWeekday + i) % 7;
      this.headerLabels.push(this._weekdayShort[idx]);
    }
  }

  onDayClick(day: Day) { /* ... */ }
}

