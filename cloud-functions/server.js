import express, { Router }  from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
import * as handlers from './index.js';
import { ReasonPhrases } from 'http-status-codes';

const app = express();
export const expressApp = app;

const require = createRequire(import.meta.url);
const swaggerDocument = require('./swagger.json');
import { verifyToken } from './app/middleware/auth.js';

// Routers
const publicRouter = Router();
const protectedRouter = Router();
protectedRouter.use(verifyToken);


// Middleware
app.use(cors());
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/', publicRouter);
app.use('/', protectedRouter);

// Health check endpoint
publicRouter.get('/', (_req, res) => {
	res.status(200).send('NeoInbox API is running');
});

// Watch endpoints
protectedRouter.post('/watch-renew', async (req, res) => {
	req.method = 'POST';
	await handlers.watchRenew(req, res);
});

protectedRouter.post('/watch-enable', async (req, res) => {
	req.method = 'POST';
	await handlers.watchEnable(req, res);
});

protectedRouter.post('/watch-disable', async (req, res) => {
	req.method = 'POST';
	await handlers.watchDisable(req, res);
});

protectedRouter.get('/watch-status', async (req, res) => {
	req.method = 'GET';
	await handlers.watchStatus(req, res);
});

// Auth endpoints
publicRouter.post('/auth-url', async (req, res) => {
	req.method = 'POST';
	await handlers.authUrl(req, res);
});

publicRouter.post('/auth-token', async (req, res) => {
	req.method = 'POST';
	await handlers.authToken(req, res);
});

// Macro endpoints
protectedRouter.post('/macro-create', async (req, res) => {
	req.method = 'POST';
	await handlers.macroCreate(req, res);
});

protectedRouter.delete('/macro-delete', async (req, res) => {
	req.method = 'DELETE';
	await handlers.macroDelete(req, res);
});

protectedRouter.get('/macro-get', async (req, res) => {
	req.method = 'GET';
	await handlers.macroGet(req, res);
});

protectedRouter.get('/macro-get-all', async (req, res) => {
	req.method = 'GET';
	await handlers.macroGetAll(req, res);
});

protectedRouter.get('/macro-get-all-filtered', async (req, res) => {
	req.method = 'GET';
	await handlers.macroGetAllFiltered(req, res);
});

// Error handling middleware
publicRouter.use((err, _req, res, _next) => {
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
