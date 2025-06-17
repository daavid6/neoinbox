export const testMatch = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test|integration.test).[tj]s?(x)'];
export const testEnvironment = 'node';
export const transform = {
	'^.+\\.jsx?$': 'babel-jest',
};
