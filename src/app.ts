import cors from 'cors';
import express from 'express';
import routes from './routes';
import { corsOptions } from './config/cors.config';

const app = express();

app.use(express.text({ type: 'text/plain' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'email-service' });
});

export default app;