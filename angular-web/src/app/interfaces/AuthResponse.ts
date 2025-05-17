import { Tokens } from './Tokens';

export interface AuthResponse {
	tokens: Tokens;
	userId: string;
	jwtToken: string;
}
