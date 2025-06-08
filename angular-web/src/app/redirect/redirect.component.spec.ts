import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { of } from 'rxjs';

import { RedirectComponent } from './redirect.component';

describe('RedirectComponent', () => {
	let component: RedirectComponent;
	let fixture: ComponentFixture<RedirectComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RedirectComponent, RouterTestingModule, HttpClientTestingModule],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: { queryParams: of({ code: 'test-code' }) },
				},
			],
		}).compileComponents();

		fixture = TestBed.createComponent(RedirectComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
