import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
import * as handlers from './index.js';
import { ReasonPhrases } from 'http-status-codes';

const app = express();
export const expressApp = app;

const require = createRequire(import.meta.url);
const swaggerDocument = require('./swagger.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/', (_req, res) => {
	res.status(200).send('NeoInbox API is running');
});

// Watch endpoints
app.post('/watch-renew', async (req, res) => {
	req.method = 'POST'; // Ensure method is set
	await handlers.watchRenew(req, res);
});

app.post('/watch-enable', async (req, res) => {
	req.method = 'POST';
	await handlers.watchEnable(req, res);
});

app.post('/watch-disable', async (req, res) => {
	req.method = 'POST';
	await handlers.watchDisable(req, res);
});

app.get('/watch-status', async (req, res) => {
	req.method = 'GET';
	await handlers.watchStatus(req, res);
});

// Auth endpoints
app.post('/auth-url', async (req, res) => {
	req.method = 'POST';
	await handlers.authUrl(req, res);
});

app.post('/auth-token', async (req, res) => {
	req.method = 'POST';
	await handlers.authToken(req, res);
});

// Macro endpoints
app.post('/macro-create', async (req, res) => {
	req.method = 'POST';
	await handlers.macroCreate(req, res);
});

app.delete('/macro-delete', async (req, res) => {
	req.method = 'DELETE';
	await handlers.macroDelete(req, res);
});

app.get('/macro-get', async (req, res) => {
	req.method = 'GET';
	await handlers.macroGet(req, res);
});

app.get('/macro-get-all', async (req, res) => {
	req.method = 'GET';
	await handlers.macroGetAll(req, res);
});

app.get('/macro-get-all-filtered', async (req, res) => {
	req.method = 'GET';
	await handlers.macroGetAllFiltered(req, res);
});

// Error handling middleware
app.use((err, _req, res, _next) => {
	console.error(err.stack);
	res.status(500).send({
		error: ReasonPhrases.INTERNAL_SERVER_ERROR,
		errorMessage: 'An unexpected error occurred',
	});
});

// Configure the port - use environment variable or fall back to a default
const PORT = 5001;

// Only start the server if this file is run directly.
if (process.argv[1] === import.meta.filename) {
	app.listen(PORT, () => {
		console.log(`NeoInbox API server running on port ${PORT}`);
	});
}
