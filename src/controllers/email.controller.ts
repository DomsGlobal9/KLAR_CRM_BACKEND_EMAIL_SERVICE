import { Request, Response } from 'express';
import { emailService } from '../services/email.service';

export const emailController = {
    async sendEmail(req: Request, res: Response) {
        try {
            const { to, subject, text, html, cc, bcc, leadId, contactId } = req.body;

            if (!to) {
                return res.status(400).json({
                    success: false,
                    error: 'Recipient email (to) is required',
                });
            }

            if (!subject) {
                return res.status(400).json({
                    success: false,
                    error: 'Subject is required',
                });
            }

            if (!text && !html) {
                return res.status(400).json({
                    success: false,
                    error: 'Either text or html content is required',
                });
            }

            const result = await emailService.sendEmail({
                to,
                subject,
                text,
                html,
                cc,
                bcc,
                leadId,
                contactId,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error,
                });
            }

            res.json({
                success: true,
                message: 'Email sent successfully',
                data: {
                    messageId: result.messageId,
                    trackingId: result.trackingId,
                },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },

    async sendSimpleEmail(req: Request, res: Response) {
        try {
            const { to, subject, text, leadId, contactId } = req.body;

            if (!to || !subject || !text) {
                return res.status(400).json({
                    success: false,
                    error: 'to, subject, and text are required',
                });
            }

            const result = await emailService.sendSimpleEmail(to, subject, text, { leadId, contactId });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error,
                });
            }

            res.json({
                success: true,
                message: 'Email sent successfully',
                data: {
                    messageId: result.messageId,
                    trackingId: result.trackingId,
                },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },

    async sendHtmlEmail(req: Request, res: Response) {
        try {
            const { to, subject, html, leadId, contactId } = req.body;

            if (!to || !subject || !html) {
                return res.status(400).json({
                    success: false,
                    error: 'to, subject, and html are required',
                });
            }

            const result = await emailService.sendHtmlEmail(to, subject, html, { leadId, contactId });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error,
                });
            }

            res.json({
                success: true,
                message: 'Email sent successfully',
                data: {
                    messageId: result.messageId,
                    trackingId: result.trackingId,
                },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },

    async sendBulkEmails(req: Request, res: Response) {
        try {
            const { emails } = req.body;

            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'emails array is required',
                });
            }

            const result = await emailService.sendBulkEmails(emails);

            res.json({
                success: true,
                message: `Sent ${result.success} out of ${result.total} emails`,
                data: {
                    total: result.total,
                    successCount: result.success,
                    failedCount: result.failed,
                    results: result.results,
                },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },


    async getAllEmails(req: Request, res: Response) {
        try {
            const { limit, offset, direction } = req.query;

            const emails = await emailService.getAllEmails({
                limit: limit ? parseInt(limit as string) : undefined,
                offset: offset ? parseInt(offset as string) : undefined,
                direction: direction as 'incoming' | 'outgoing' | undefined,
            });

            return res.status(200).json({
                success: true,
                count: emails.length,
                data: emails,
            });
        } catch (error: any) {
            console.error('[Get All Emails] Error:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    async getEmailById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email ID is required',
                });
            }

            const email = await emailService.getEmailById(id as string);

            if (!email) {
                return res.status(404).json({
                    success: false,
                    message: 'Email not found',
                });
            }

            return res.status(200).json({
                success: true,
                data: email,
            });
        } catch (error: any) {
            console.error('[Get Email By Id] Error:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};