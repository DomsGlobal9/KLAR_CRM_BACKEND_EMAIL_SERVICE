import express from 'express';

import routes from './routes';

const app = express();

app.use(express.text({ type: 'text/plain' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'email-service' });
});

export default app;