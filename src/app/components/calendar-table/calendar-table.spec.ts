import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarTable } from './calendar-table';

describe('CalendarTable', () => {
  let component: CalendarTable;
  let fixture: ComponentFixture<CalendarTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
