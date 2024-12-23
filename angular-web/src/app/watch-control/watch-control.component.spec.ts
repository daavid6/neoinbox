import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchControlComponent } from './watch-control.component';

describe('WatchControlComponent', () => {
  let component: WatchControlComponent;
  let fixture: ComponentFixture<WatchControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WatchControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
