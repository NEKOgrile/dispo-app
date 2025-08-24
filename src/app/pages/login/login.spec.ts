import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent], // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start at step 0', () => {
    expect(component.step as number).toBe(0);
  });

  it('should go to step 1 after next() if name is filled', () => {
    component.name = 'Jean';
    component.next();
    expect(component.step as number).toBe(1);
  });

  it('should not go to step 1 if name is empty', () => {
    component.name = '';
    component.next();
    expect(component.step as number).toBe(0);
  });

  it('should return to step 0 after prev()', () => {
    component.step = 1;
    component.prev();
    expect(component.step as number).toBe(0);
  });

  it('should save userLocal on submit if address is filled', () => {
    component.step = 1;
    component.name = 'Jean';
    component.address = '123 Rue Exemple';
    component.onSubmit();

    expect(component.userLocal).toEqual({
      name: 'Jean',
      address: '123 Rue Exemple',
    });

    expect(component.step as number).toBe(0);
  });

  it('should not save userLocal on submit if address is empty', () => {
    component.step = 1;
    component.name = 'Jean';
    component.address = '';
    component.onSubmit();

    expect(component.userLocal).toBeNull();
    expect(component.step as number).toBe(1);
  });
});
