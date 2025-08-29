// ors.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { SupabaseService } from './supabase'; // si tu as encore besoin du supabaseService pour autre chose

@Injectable({ providedIn: 'root' })
export class OrsService {
  private apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkOTZkNmM5NzZiNTRjNGM5MTJhOWYzNDkyZmMwNjYwIiwiaCI6Im11cm11cjY0In0='; // remplace par ta clé ou get depuis env
  private baseUrl = 'https://api.openrouteservice.org';

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService // optionnel : seulement si tu l'utilises
  ) {}

  private authHeaders() {
    return new HttpHeaders({
      Authorization: this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  geocode(address: string) {
    const url = `${this.baseUrl}/geocode/search?text=${encodeURIComponent(address)}`;
    return this.http.get<any>(url, { headers: this.authHeaders() }).pipe(
      map(res => {
        const coord = res.features?.[0]?.geometry?.coordinates;
        return coord ? { lon: coord[0], lat: coord[1] } : null;
      })
    );
  }

  getMatrix(origin: { lon: number; lat: number }, dest: { lon: number; lat: number }) {
    const url = `${this.baseUrl}/v2/matrix/driving-car`;
    const body = {
      locations: [
        [origin.lon, origin.lat],
        [dest.lon, dest.lat]
      ],
      metrics: ['distance', 'duration'],
      units: 'km'
    };
    return this.http.post<any>(url, body, { headers: this.authHeaders() }).pipe(
      map(res => {
        const dist = res.distances?.[0]?.[1];
        const dur = res.durations?.[0]?.[1];
        return { distanceKm: dist, durationSec: dur };
      })
    );
  }
}
