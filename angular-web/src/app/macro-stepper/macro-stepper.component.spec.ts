import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroStepperComponent } from './macro-stepper.component';

describe('MacroStepperComponent', () => {
  let component: MacroStepperComponent;
  let fixture: ComponentFixture<MacroStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroStepperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MacroStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
