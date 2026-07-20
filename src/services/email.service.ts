import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { emailConfig, EmailOptions } from '../config/email.config';
import { emailMessageRepository } from '../repositories/email-message.repository';
import { randomUUID } from 'crypto';

export class EmailService {
    private ses: SESClient;

    constructor() {
        this.ses = new SESClient({
            region: emailConfig.region,
            credentials: emailConfig.credentials,
        });
    }

    async sendEmail(options: EmailOptions): Promise<any> {
        const trackingId = options.trackingId || randomUUID();
        let savedEmail = null;

        try {
            const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
            const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
            const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

            const emailData = {
                trackingId,
                parentTrackingId: options.parentTrackingId || null,
                messageId: null,
                inReplyTo: options.inReplyTo || null,
                references: options.references || null,
                direction: 'outgoing',
                fromEmail: emailConfig.from,
                fromName: null,
                toEmail: toAddresses,
                ccEmail: ccAddresses,
                bccEmail: bccAddresses,
                subject: options.subject,
                body: options.text || null,
                htmlBody: options.html || null,
                attachments: [],
                rawHeaders: null,
                status: 'sending',
                error: null,
                leadId: options.leadId || null,
                contactId: options.contactId || null,
                isRead: false,
                sentAt: null,
                receivedAt: null,
            };

            savedEmail = await emailMessageRepository.saveOutgoingEmail(emailData);

            const params: SendEmailCommandInput = {
                Source: emailConfig.from,
                Destination: {
                    ToAddresses: toAddresses,
                    CcAddresses: ccAddresses.length > 0 ? ccAddresses : undefined,
                    BccAddresses: bccAddresses.length > 0 ? bccAddresses : undefined,
                },
                Message: {
                    Subject: {
                        Data: options.subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Text: options.text ? {
                            Data: options.text,
                            Charset: 'UTF-8',
                        } : undefined,
                        Html: options.html ? {
                            Data: options.html,
                            Charset: 'UTF-8',
                        } : undefined,
                    },
                },
            };

            const command = new SendEmailCommand(params);
            const result = await this.ses.send(command);

            await emailMessageRepository.updateStatus(savedEmail.id, 'sent', result.MessageId);

            return {
                success: true,
                messageId: result.MessageId,
                trackingId: trackingId,
                dbId: savedEmail.id,
            };
        } catch (error: any) {
            console.error('Email send error:', error);

            if (savedEmail) {
                await emailMessageRepository.updateStatus(savedEmail.id, 'failed', undefined, error.message);
            }

            return {
                success: false,
                error: error.message,
                trackingId: trackingId,
            };
        }
    }

    async sendSimpleEmail(to: string, subject: string, text: string, options?: { leadId?: string; contactId?: string }): Promise<any> {
        return this.sendEmail({
            to,
            subject,
            text,
            leadId: options?.leadId,
            contactId: options?.contactId,
        });
    }

    async sendHtmlEmail(to: string, subject: string, html: string, options?: { leadId?: string; contactId?: string }): Promise<any> {
        return this.sendEmail({
            to,
            subject,
            html,
            leadId: options?.leadId,
            contactId: options?.contactId,
        });
    }

    async sendBulkEmails(emails: Array<{
        to: string;
        subject: string;
        text?: string;
        html?: string;
        leadId?: string;
        contactId?: string;
    }>): Promise<any> {
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const email of emails) {
            const result = await this.sendEmail({
                to: email.to,
                subject: email.subject,
                text: email.text,
                html: email.html,
                leadId: email.leadId,
                contactId: email.contactId,
            });
            results.push(result);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        }

        return {
            total: emails.length,
            success: successCount,
            failed: failCount,
            results,
        };
    }

    async getAllEmails(options?: { limit?: number; offset?: number; direction?: 'incoming' | 'outgoing' }) {
        return await emailMessageRepository.getAllEmails(options);
    }

    async getEmailById(id: string) {
        return await emailMessageRepository.getById(id);
    }
}

export const emailService = new EmailService();