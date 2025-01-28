import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroCreateComponent } from './macro-create.component';

describe('MacroCreateComponent', () => {
  let component: MacroCreateComponent;
  let fixture: ComponentFixture<MacroCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MacroCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
