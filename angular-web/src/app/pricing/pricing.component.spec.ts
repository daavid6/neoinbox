import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
	let component: PricingComponent;
	let fixture: ComponentFixture<PricingComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PricingComponent, BrowserAnimationsModule, RouterTestingModule],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(PricingComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create the component', () => {
		expect(component).toBeTruthy();
	});
});
