import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroMenuComponent } from './macro-menu.component';

describe('MacroMenuComponent', () => {
  let component: MacroMenuComponent;
  let fixture: ComponentFixture<MacroMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MacroMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
