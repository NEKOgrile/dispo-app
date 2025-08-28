import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrsService } from '../../ors.service';
import { CalendarTableComponent } from '../calendar-table/calendar-table';

interface Day {
  date: Date;
  users: { name: string; color: string }[];
}

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule, CalendarTableComponent],
  template: `
    <div class="center-wrapper">
      <div class="card">
        <h1 class="title">{{ userName }}</h1>
        <p>{{ message }}</p>

        <app-calendar-table [days]="days" [selectedUser]="currentUser"></app-calendar-table>

        <!-- Légende des utilisateurs -->
        <div class="legend">
          <div *ngFor="let user of usersLegend" class="legend-item">
            <span class="dot" [style.background-color]="user.color"></span> {{ user.name }}
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar-grid.scss']
})
export class CalendarGridComponent implements OnInit {
  message: string = 'Calcul en cours...';

  // Pour le calendrier
  days: Day[] = [];
  currentUser = { name: 'Enora', color: 'green' };
  userName: string = 'Utilisateur';

  // Liste des utilisateurs pour la légende
  usersLegend = [
    { name: 'Enora', color: 'green' },
    { name: 'Willem', color: 'violet' },
    { name: 'Melvin', color: 'blue' }
  ];

  constructor(private ors: OrsService) {}

  ngOnInit() {
    // --- Récupération du user depuis localStorage ---
    const user = JSON.parse(localStorage.getItem('app_user') || '{}');
    this.userName = user?.name || 'Utilisateur';
    this.currentUser.name = this.userName;

    // --- Distance ORS ---
    const adresseUtilisateur = user?.address || '17 place jean jaurès carmaux';
    const adresseDestination = '101 chemin matens Gaillac';

    if(user.minutes && user.km){
      this.message = `Tu es à ${user.minutes} minutes — ${user.km} km de ${adresseDestination}`;
    } else {
      this.ors.geocode(adresseUtilisateur).subscribe(origin => {
        if (!origin) {
          this.message = "Impossible de trouver ton adresse.";
          return;
        }
        this.ors.geocode(adresseDestination).subscribe(dest => {
          if (!dest) {
            this.message = "Impossible de trouver la destination.";
            return;
          }
          this.ors.getMatrix(origin, dest).subscribe(result => {
            const minutes = Math.round(result.durationSec / 60);
            const km = result.distanceKm.toFixed(1);

            user.minutes = minutes;
            user.km = km;
            localStorage.setItem('app_user', JSON.stringify(user));

            this.message = `Tu es à ${minutes} minutes — ${km} km de ${adresseDestination}`;
          });
        });
      });
    }

    // --- Calendrier (15 derniers jours / 15 prochains jours) ---
    const today = new Date();
    for (let i = -15; i <= 15; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      this.days.push({ date: d, users: [] });
    }
  }
}
