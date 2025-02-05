import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { Macro } from '../interfaces/Macro';
import { NameId } from '../interfaces/Other';
import { ACTION } from '../interfaces/Macro';

type ReducedLabel = NameId;

@Injectable({
	providedIn: 'root',
})
export class MacroService {
	constructor(private http: HttpClient) {}

	public async getAllMacros(userId: string) {
		return await firstValueFrom(
			this.http.get<Macro[]>(`http://localhost:3000/api/macro/get-all/${userId}`),
		);
	}

	public async createMacro(
		userId: string,
		name: string,
		labels: ReducedLabel[],
		actionType: ACTION,
		service: string,
		remainder: any,
	): Promise<void> {
		await firstValueFrom(
			this.http.post<string>(`http://localhost:3000/api/macro/create`, {
				userId,
				name,
				labels,
				actionType,
				service,
				remainder,
			}),
		);
	}
}
