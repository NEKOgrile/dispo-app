// supabase.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tigfgvqiizitwxchhxbz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZ2ZndnFpaXppdHd4Y2hoeGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA4NjIsImV4cCI6MjA3MTg2Njg2Mn0.6kQsyzr4xzaQ_qKN9XLEpjYhnmUCv98fYPogWJnUhVI'; // ⚠️ Anon key (fourni dans ton projet)

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // getter pratique (tu l'utilisais déjà)
  get supabase() {
    return this.client;
  }

  // ---------------------------
  // Palette + assignation couleur
  // ---------------------------

  private palette: string[] = [
    '#7c5cff', // violet
    '#5a8bff', // bleu
    '#00c853', // vert
    '#ff6b6b', // rouge corail
    '#ffb86b', // orange
    '#00bcd4', // cyan
    '#f06292', // rose
    '#ffd54f', // jaune
    '#8d6e63'  // brun
  ];

  /**
   * Assigne une couleur à l'utilisateur s'il n'en a pas encore.
   * - lit la couleur en DB
   * - si absente : récupère les couleurs déjà utilisées, choisit une dispo ou génère une
   * - met à jour la table users
   * Retourne la couleur finale (string).
   */
  async ensureUserColor(userId: string): Promise<string> {
    if (!userId) throw new Error('userId manquant');

    // 1) lire la couleur existante
    const { data: userRow, error: e1 } = await this.supabase
      .from('users')
      .select('color')
      .eq('id', userId)
      .single();

    if (e1 && e1.code !== 'PGRST116') { // PGRST116 = row not found (selon version) — adapte selon cas
      console.error('Erreur lecture user:', e1);
      throw e1;
    }

    if (userRow?.color) {
      return userRow.color; // déjà assignée
    }

    // 2) récupérer couleurs déjà utilisées (non null)
    const { data: usedRows, error: e2 } = await this.supabase
      .from('users')
      .select('color')
      .not('color', 'is', null);

    if (e2) {
      console.warn('Impossible de récupérer couleurs utilisées :', e2);
    }

    const used = (usedRows || []).map((r: any) => r.color).filter(Boolean);
    const avail = this.palette.filter(c => !used.includes(c));

    // 3) choisir une couleur : palette libre sinon fallback déterministe
    const chosen = avail.length > 0
      ? avail[Math.floor(Math.random() * avail.length)]
      : this._generateColorFromId(userId); // synchrone

    // 4) mettre à jour en base (update, pas insert)

    console.log("CHECK user id avant update:", chosen);


    const { data: updated, error: e3 } = await this.supabase
      .from('users')
      .update({ 'color': chosen })
      .eq('id', userId)
      .select()
      .single();

    if (e3) {
      console.error('Erreur update color:', e3);
      // On ne throw pas forcément, on renvoie quand même la couleur choisie (au cas où)
      return chosen;
    }

    return chosen;
  }

  // fallback synchrone : retourne une couleur HSL à partir de l'id
  private _generateColorFromId(id: string): string {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = (h * 31 + id.charCodeAt(i)) % 360;
    }
    // HSL est pratique (ou tu peux convertir en hex si tu veux)
    return `hsl(${h} 70% 55%)`;
  }
}
