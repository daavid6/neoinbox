import express from 'express';
import cors from 'cors';
import router from './endpoint.js';
import { google } from 'googleapis';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
