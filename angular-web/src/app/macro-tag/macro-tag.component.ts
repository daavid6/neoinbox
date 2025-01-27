import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-macro-tag',
	imports: [],
	templateUrl: './macro-tag.component.html',
	styleUrl: './macro-tag.component.css',
})
export class MacroTagComponent {
	@Input() text: string = '';
}
