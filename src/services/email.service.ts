import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { emailConfig, EmailOptions } from '../config/email.config';

export class EmailService {
    private ses: SESClient;

    constructor() {
        this.ses = new SESClient({
            region: emailConfig.region,
            credentials: emailConfig.credentials,
        });
    }

    async sendEmail(options: EmailOptions): Promise<any> {
        try {
            const params: SendEmailCommandInput = {
                Source: emailConfig.from,
                Destination: {
                    ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
                    CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
                    BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
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

            return {
                success: true,
                messageId: result.MessageId,
            };
        } catch (error: any) {
            console.error('Email send error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async sendSimpleEmail(to: string, subject: string, text: string): Promise<any> {
        return this.sendEmail({
            to,
            subject,
            text,
        });
    }

    async sendHtmlEmail(to: string, subject: string, html: string): Promise<any> {
        return this.sendEmail({
            to,
            subject,
            html,
        });
    }

    async sendBulkEmails(emails: Array<{ to: string; subject: string; text?: string; html?: string }>): Promise<any> {
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const email of emails) {
            const result = await this.sendEmail(email);
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
}

export const emailService = new EmailService();