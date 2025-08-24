import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // NgIf et ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements AfterViewInit {
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

  onSubmit() {
    if (!this.address.trim()) return;
    this.saveToLocalStorage();
    console.log('✅ Enregistré localement:', { name: this.name, address: this.address });
    this.step = 0;
    setTimeout(() => this.firstRef?.nativeElement.focus(), 120);
  }

  getTranslate() {
    return this.step === 0 ? 'translateX(0%)' : 'translateX(-50%)';
  }
}
