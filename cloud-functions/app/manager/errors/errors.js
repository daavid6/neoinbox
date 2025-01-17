// Base validation error
export class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ValidationError';
	}
}

// Missing required variable error
export class RequiredVariableError extends ValidationError {
	constructor(variable) {
		const variableName = Object.keys(variable)[0];

		super(`Required variable missing: ${remark(variableName)}`);
		this.name = 'RequiredVariableError';
		this.variableName = variableName;
	}
}

// Token error
export class TokenError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TokenError';
	}
}

export class UnexpectedError extends Error {
	constructor(message) {
		super(message);
		this.name = 'UnexpectedError';
	}
}

function remark(txt) {
	return `\x1b[1m\x1b[31m${txt}\x1b[0m`;
}

// Base CRUD error
export class FirestoreCRUDError extends Error {
	constructor(message) {
		super(message);
		this.name = 'FirestoreCRUDError';
	}
}

export class DocumentAlreadyExists extends FirestoreCRUDError {
	constructor(message) {
		super(message);
		this.name = 'DocumentAlreadyExists';
	}
}

export class DocumentNotFound extends FirestoreCRUDError {
	constructor(message) {
		super(message);
		this.name = 'DocumentNotFound';
	}
}
