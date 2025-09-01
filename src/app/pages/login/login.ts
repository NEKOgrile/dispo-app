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
  getUserFromLocalStorage(): { name: string; address: string } | null {
    const saved = localStorage.getItem('app_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
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

next(event?: Event) {
  event?.preventDefault(); // ⛔ bloque le submit auto
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

  // 1) sauvegarde locale (déjà fait)
  this.saveToLocalStorage();

  // 2) vérifier si l'utilisateur existe déjà en DB
  const { data: existing, error } = await this.supabaseService.supabase
    .from('users')
    .select('*')
    .eq('name', this.name.trim())
    .eq('address', this.address.trim());

  if (error) {
    console.error('❌ Erreur Supabase:', error.message);
    return;
  }




  let userFromDb: any = null;

  if (existing && existing.length > 0) {
    // utilisateur trouvé
    userFromDb = existing[0];
    console.log('⚠️ Déjà présent dans Supabase:', userFromDb);
  } else {
    // insérer l'utilisateur
    const { data: inserted, error: insertError } = await this.supabaseService.supabase
      .from('users')
      .insert([{ name: this.name.trim(), address: this.address.trim() }])
      .select()
      .single(); // récupère l'objet inséré directement

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError.message);
      return;
    }
    userFromDb = inserted;
    console.log('✅ Ajouté dans Supabase:', userFromDb);
    console.log("INSERTED =", inserted);

  }
    console.log("existing = " , existing)

  // 3) s'assurer que l'utilisateur a une couleur (assignation si besoin)
  try {
    // userFromDb.id doit exister (uuid de supabase)
    const color = await this.supabaseService.ensureUserColor(userFromDb.id);

    // 4) mettre à jour le localStorage avec id, name, address, color
    const local = {
      id: userFromDb.id,
      name: userFromDb.name,
      address: userFromDb.address,
      color
    };
    localStorage.setItem('app_user', JSON.stringify(local));

  } catch (err) {
    console.error('Erreur lors de l\'assignation de couleur :', err);
    // tu peux quand même continuer sans couleur, ou choisir une couleur par défaut
  }

  // 5) navigation vers le calendar
  this.router.navigate(['/calendar']);
}



  getTranslate() {
    return this.step === 0 ? 'translateX(0%)' : 'translateX(-50%)';
  }
}
