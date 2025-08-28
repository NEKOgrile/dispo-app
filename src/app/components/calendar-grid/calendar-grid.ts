import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrsService } from '../../ors.service';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule], // plus HttpClientModule
  template: `
    <div class="center-wrapper">
      <div class="card">
        <h1 class="title">Calcul de distance</h1>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./calendar-grid.scss']
})
export class CalendarGridComponent implements OnInit {
  message: string = 'Calcul en cours...';

  constructor(private ors: OrsService) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('app_user') || '{}');
    const adresseUtilisateur = user?.address || '17 place jean jaurès carmaux';
    const adresseDestination = '101 chemin matens Gaillac';

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
          this.message = `Tu es à ${minutes} minutes — ${km} km de ${adresseDestination}`;
        });
      });
    });
  }
}
