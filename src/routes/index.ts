import { Router } from 'express';

import EmailSendRoute from "./email.routes";
import EmailReveiveRoutes from './email-receive.routes';



const router = Router();




/**
 * Base API routes
 */
router.use('/email/receive', EmailReveiveRoutes);
router.use('/email', EmailSendRoute);


export default router;