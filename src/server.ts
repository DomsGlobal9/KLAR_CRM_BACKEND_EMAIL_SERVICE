import app from './app';
import { envConfig } from "./config/env.config";

const PORT = envConfig.PORT || 3000;

async function startServer() {
    app.listen(PORT, () => {
        console.log(`🚀 CRM Email Service running on port ${PORT}`);
    });
}

startServer();