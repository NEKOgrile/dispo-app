import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tigfgvqiizitwxchhxbz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZ2ZndnFpaXppdHd4Y2hoeGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTA4NjIsImV4cCI6MjA3MTg2Njg2Mn0.6kQsyzr4xzaQ_qKN9XLEpjYhnmUCv98fYPogWJnUhVI'; // ⚠️ Anon key

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  get supabase() {
    return this.client;
  }
}
