import { Router } from 'express';
import { emailController } from '../controllers/email.controller';

const router = Router();

/**
 * Send email with full options 
 * With (to, subject, text, html, cc, bcc)
 */
router.post('/send', emailController.sendEmail);

/**
 * Send simple plain text email
 */
router.post('/send-html', emailController.sendHtmlEmail);

/**
 * Send HTML email
 */
router.post('/send-bulk', emailController.sendBulkEmails);

/**
 * Send bulk emails
 */
router.post('/send-simple', emailController.sendSimpleEmail);


router.get('/all', emailController.getAllEmails);
router.get('/:id', emailController.getEmailById);


export default router;