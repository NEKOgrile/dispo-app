// calendar-grid.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { OrsService } from '../../ors.service';
import { CalendarTableComponent } from '../calendar-table/calendar-table';
import { SupabaseService } from '../../supabase'; // ajuste le chemin si nécessaire

interface Day {
  date: Date;
  users: { name: string; color: string }[];
}

interface DBUser {
  id: string;
  name: string;
  color: string;
  available_date: string[] | null; // peut être null en DB
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

        <!-- 👇 on ajoute juste le binding (toggleDate) pour notifier le parent -->
        <app-calendar-table
          [days]="days"
          [selectedUser]="currentUser"
          (toggleDate)="onToggleDate($event)">
        </app-calendar-table>

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

  // Légende
  usersLegend: { name: string; color: string }[] = [];

  // Cache des utilisateurs + dispos pour remplir la grille et faire les updates
  private allUsers: DBUser[] = [];

  constructor(
    private ors: OrsService,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    // --- Récupération du user depuis localStorage ---
    const user = JSON.parse(localStorage.getItem('app_user') || '{}');
    this.userName = user?.name || 'Utilisateur';
    this.currentUser.name = this.userName;

    // --- Récupération de la légende + dispos (on inclut id et available_date) ---
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('id, name, color, available_date');

      if (error) {
        console.error('Erreur récupération usersLegend:', error.message);
      } else if (data) {
        this.allUsers = (data as DBUser[]) || [];
        this.usersLegend = this.allUsers.map(u => ({ name: u.name, color: u.color }));
      }
    } catch (err) {
      console.error('Exception récupération usersLegend:', err);
    }

    // --- Chargement de la couleur du user (localStorage -> Supabase fallback) ---
    if (user?.color) {
      this.currentUser.color = user.color;
    } else if (user?.id) {
      try {
        const res = await this.supabaseService.supabase
          .from('users')
          .select('color, name')
          .eq('id', user.id)
          .single();

        if (res.error) {
          console.warn('Impossible de récupérer la couleur depuis Supabase:', res.error.message);
        } else if (res.data) {
          const dbUser: any = res.data;
          if (dbUser.color) {
            this.currentUser.color = dbUser.color;
            user.color = dbUser.color;
            localStorage.setItem('app_user', JSON.stringify(user));
          }
          if (dbUser.name) {
            this.userName = dbUser.name;
            user.name = dbUser.name;
            localStorage.setItem('app_user', JSON.stringify(user));
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération user Supabase:', err);
      }
    }

    // --- Calendrier (15 derniers jours / 15 prochains jours) ---
    this.days = [];
    const today = new Date();
    for (let i = -15; i <= 15; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      this.days.push({ date: d, users: [] });
    }

    // 🔄 Remplir les pastilles à partir des dispos en DB
    this._fillDotsFromDB();

    // --- Distance ORS (ne bloque pas le rendu) ---
    const adresseUtilisateur = user?.address || '17 place jean jaurès carmaux';
    const adresseDestination = '101 chemin matens Gaillac';
    // lance en asynchrone (ne bloque pas ngOnInit)
    this._computeDistanceAndSetMessage(user, adresseUtilisateur, adresseDestination);
  }

  // ======================================================
  // 🔔 Appelé quand on clique une case (émis par le child)
  // ======================================================
  async onToggleDate(date: Date) {
    const lsUser = JSON.parse(localStorage.getItem('app_user') || '{}');
    if (!lsUser?.id) return;

    const isoDate = this._toISODate(date);

    // état actuel en DB (dans le cache allUsers)
    const me = this.allUsers.find(u => u.id === lsUser.id);
    if (!me) return;

    const current = Array.isArray(me.available_date) ? [...me.available_date] : [];
    const already = current.includes(isoDate);

    const next = already
      ? current.filter(d => d !== isoDate) // retirer
      : [...current, isoDate];             // ajouter

    // Update en base
    const { error: updateErr } = await this.supabaseService.supabase
      .from('users')
      .update({ available_date: next })
      .eq('id', lsUser.id);

    if (updateErr) {
      console.error('Erreur update available_date:', updateErr.message);
      // ❗ Re-synchronise l'UI avec l'état DB connu (annule le toggle visuel fait par le child)
      this._fillDotsFromDB();
      return;
    }

    // ✅ Succès : met à jour le cache puis re-remplit la grille proprement
    me.available_date = next;
    this._fillDotsFromDB();
  }

  // Convertit une Date JS en YYYY-MM-DD (sans décalage TZ)
  private _toISODate(d: Date): string {
    const tz = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tz * 60000);
    return local.toISOString().slice(0, 10);
  }

  // Recalcule les pastilles pour chaque jour à partir de allUsers.available_date
  private _fillDotsFromDB() {
    if (!this.allUsers || this.allUsers.length === 0) return;

    for (const day of this.days) {
      const iso = this._toISODate(day.date);
      const usersForDay = this.allUsers
        .filter(u => Array.isArray(u.available_date) && u.available_date!.includes(iso))
        .map(u => ({ name: u.name, color: u.color }));

      day.users = usersForDay;
    }
  }

  // ---------------------------
  // Helpers ORS (non-blocking)
  // ---------------------------
  private async _computeDistanceAndSetMessage(user: any, adresseUtilisateur: string, adresseDestination: string) {
    console.log('--- ORS debug start ---');
    console.log('this.ors =', this.ors);
    console.log('typeof this.ors.geocode =', typeof this.ors?.geocode);
    console.log('adresseUtilisateur =', adresseUtilisateur);
    console.log('adresseDestination =', adresseDestination);

    const resolveGeo = async (call: any) => {
      if (!call) return null;
      try {
        if (typeof call.then === 'function') return await call; // Promise
        return await firstValueFrom(call); // Observable
      } catch (err) {
        console.error('Erreur resolveGeo:', err);
        return null;
      }
    };

    const extractCoordsFromGeocode = (resp: any): { lat: number; lon: number } | null => {
      if (!resp) return null;
      const payload = resp.data ?? resp;
      if (!payload) return null;

      if (payload.features && payload.features.length > 0) {
        const coords = payload.features[0].geometry?.coordinates;
        if (coords && coords.length >= 2) {
          return { lat: coords[1], lon: coords[0] };
        }
      }

      if (Array.isArray(payload) && payload.length > 0) {
        const first = payload[0];
        if (first?.geometry?.coordinates) {
          const c = first.geometry.coordinates;
          return { lat: c[1], lon: c[0] };
        }
        if (first?.lat && first?.lon) return { lat: first.lat, lon: first.lon };
        if (first?.latitude && first?.longitude) return { lat: first.latitude, lon: first.longitude };
      }

      if (payload.lat && payload.lon) return { lat: payload.lat, lon: payload.lon };
      if (payload.latitude && payload.longitude) return { lat: payload.latitude, lon: payload.longitude };

      return null;
    };

    const extractMatrixResult = (resp: any): { distanceKm?: number; durationSec?: number } | null => {
      if (!resp) return null;
      if (typeof resp.distanceKm === 'number' && typeof resp.durationSec === 'number') {
        return { distanceKm: resp.distanceKm, durationSec: resp.durationSec };
      }
      if (resp.data && typeof resp.data === 'object') {
        if (typeof resp.data.distanceKm === 'number' && typeof resp.data.durationSec === 'number') {
          return { distanceKm: resp.data.distanceKm, durationSec: resp.data.durationSec };
        }
        if (resp.data.raw && resp.data.raw.distances && Array.isArray(resp.data.raw.distances)) {
          const dKm = resp.data.raw.distances[0] && typeof resp.data.raw.distances[0][1] === 'number'
            ? resp.data.raw.distances[0][1] / 1000
            : undefined;
          const dur = resp.data.raw.durations && typeof resp.data.raw.durations[0][1] === 'number'
            ? resp.data.raw.durations[0][1]
            : undefined;
          return { distanceKm: dKm, durationSec: dur };
        }
      }
      return null;
    };

    try {
      if (user?.minutes && user?.km) {
        this.message = `Tu es à ${user.minutes} minutes — ${user.km} km de ${adresseDestination}`;
        console.log('ORS: using cached minutes/km');
        return;
      }

      const originCall = this.ors?.geocode?.(adresseUtilisateur);
      const originResp = await resolveGeo(originCall);
      if (!originResp) {
        this.message = "Impossible de trouver ton adresse.";
        return;
      }
      const originCoords = extractCoordsFromGeocode(originResp);
      if (!originCoords) {
        this.message = "Impossible d'extraire les coordonnées de ton adresse.";
        return;
      }

      const destCall = this.ors?.geocode?.(adresseDestination);
      const destResp = await resolveGeo(destCall);
      if (!destResp) {
        this.message = "Impossible de trouver la destination.";
        return;
      }
      const destCoords = extractCoordsFromGeocode(destResp);
      if (!destCoords) {
        this.message = "Impossible d'extraire les coordonnées de la destination.";
        return;
      }

      const matrixCall = this.ors.getMatrix(originCoords, destCoords);
      const matrixResp: any = await resolveGeo(matrixCall);

      const m = extractMatrixResult(matrixResp);
      if (!m || typeof m.distanceKm !== 'number' || typeof m.durationSec !== 'number') {
        this.message = 'Erreur lors du calcul de la distance.';
        return;
      }

      const minutes = Math.round(m.durationSec / 60);
      const km = m.distanceKm.toFixed(1);

      user.minutes = minutes;
      user.km = km;
      localStorage.setItem('app_user', JSON.stringify(user));

      this.message = `Tu es à ${minutes} minutes — ${km} km de ${adresseDestination}`;
    } catch (err) {
      console.error('Exception ORS flow:', err);
      this.message = 'Erreur géocodage adresse utilisateur.';
    }
  }
}
