import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroTagComponent } from './macro-tag.component';

describe('MacroTagComponent', () => {
  let component: MacroTagComponent;
  let fixture: ComponentFixture<MacroTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroTagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MacroTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
