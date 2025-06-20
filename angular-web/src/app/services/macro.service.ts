import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

import { ENDPOINTS } from '../enums/EndPoints';
import { ACTION, Macro } from '../interfaces/Macro';
import { NameId } from '../interfaces/NameId';

type ReducedLabel = NameId;

@Injectable({
	providedIn: 'root',
})
export class MacroService {
	constructor(private http: HttpClient) {}

	public async getAllMacros(userId: string) {
		if (!userId) return;

		const response = await firstValueFrom(
			this.http.get<{ data: { macros: Macro[] }; message: string }>(
				`${ENDPOINTS.getAllMacros}?userId=${userId}`
			)
		);

		return response.data.macros;
	}

	public async createMacro(
		userId: string,
		name: string,
		labels: ReducedLabel[],
		actionType: ACTION,
		service: string,
		remainder: object | undefined
	): Promise<void> {
		await firstValueFrom(
			this.http.post<string>(ENDPOINTS.createMacro, {
				userId,
				name,
				labels,
				actionType,
				service,
				remainder,
			})
		);
	}

	public async deleteMacro(userId: string, macroId: string): Promise<void> {
		if (!userId || !macroId) return;

		await firstValueFrom(
			this.http.delete(ENDPOINTS.deleteMacro, { body: { userId, macroId } })
		);
	}
}
