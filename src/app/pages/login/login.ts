import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../app/supabase'; 
import { Router } from '@angular/router';  // ✅ import

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // NgIf et ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements AfterViewInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}
  
  @ViewChild('first') firstRef?: ElementRef<HTMLInputElement>;
  @ViewChild('second') secondRef?: ElementRef<HTMLTextAreaElement>;
  

  step: 0 | 1 = 0;
  name: string = '';
  address: string = '';

  get userLocal() {
    const saved = localStorage.getItem('app_user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  }

  ngAfterViewInit() {
    setTimeout(() => this.firstRef?.nativeElement.focus(), 0);
  }

  private saveToLocalStorage() {
    localStorage.setItem('app_user', JSON.stringify({
      name: this.name.trim(),
      address: this.address.trim()
    }));
  }

  ngOnInit() {
    const saved = localStorage.getItem('app_user');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.name = data?.name ?? '';   // ✅ ici tu pré-remplis le champ prénom
        this.address = data?.address ?? '';
      } catch {
        localStorage.removeItem('app_user');
      }
    }
  }

  next() {
    if (!this.name.trim()) return;
    this.saveToLocalStorage();
    this.step = 1;
    setTimeout(() => this.secondRef?.nativeElement.focus(), 260);
  }

  prev() {
    this.saveToLocalStorage();
    this.step = 0;
    setTimeout(() => this.firstRef?.nativeElement.focus(), 220);
  }

  async onSubmit() {
    if (!this.address.trim()) return;

    // 1. Sauvegarde locale comme avant
    this.saveToLocalStorage();

    // 2. Vérifier dans Supabase si l'utilisateur existe déjà
    const { data: existing, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('name', this.name.trim())
      .eq('address', this.address.trim());

    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      return;
    }

    if (existing && existing.length > 0) {
      console.log('⚠️ Déjà présent dans Supabase:', existing[0]);
    } else {
      // 3. Insérer si pas trouvé
      const { data: inserted, error: insertError } = await this.supabaseService.supabase
        .from('users')
        .insert([
          { name: this.name.trim(), address: this.address.trim() }
        ])
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion:', insertError.message);
        return;
      }

      console.log('✅ Ajouté dans Supabase:', inserted[0]);
    }

    this.router.navigate(['/calendar']);;
  }


  getTranslate() {
    return this.step === 0 ? 'translateX(0%)' : 'translateX(-50%)';
  }
}
