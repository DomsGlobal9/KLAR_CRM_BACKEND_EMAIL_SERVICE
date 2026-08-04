import { Worker, Job } from 'bullmq';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/email.queue';
import { redisConnectionOptions } from '../config/redis.config';
import { emailConfig } from '../config/email.config';
import { emailMessageRepository } from '../repositories/email-message.repository';

const sesClient = new SESClient({
    region: emailConfig.region,
    credentials: emailConfig.credentials,
});

let emailWorker: Worker<EmailJobData> | null = null;

export const initEmailWorker = (): Worker<EmailJobData> => {
    if (emailWorker) return emailWorker;

    emailWorker = new Worker<EmailJobData>(
        EMAIL_QUEUE_NAME,
        async (job: Job<EmailJobData>) => {
            const { dbId, trackingId, options } = job.data;

            try {
                const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
                const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
                const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

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
                            Text: options.text
                                ? {
                                      Data: options.text,
                                      Charset: 'UTF-8',
                                  }
                                : undefined,
                            Html: options.html
                                ? {
                                      Data: options.html,
                                      Charset: 'UTF-8',
                                  }
                                : undefined,
                        },
                    },
                };

                const command = new SendEmailCommand(params);
                const result = await sesClient.send(command);

                await emailMessageRepository.updateStatus(dbId, 'sent', result.MessageId);

                return {
                    success: true,
                    messageId: result.MessageId,
                    trackingId,
                    dbId,
                };
            } catch (error: any) {
                console.error(`[EmailWorker] Failed job ${job.id} (TrackingId: ${trackingId}):`, error.message);
                await emailMessageRepository.updateStatus(dbId, 'failed', undefined, error.message);
                throw error;
            }
        },
        {
            connection: redisConnectionOptions,
            concurrency: 5,
            limiter: {
                max: 10,
                duration: 1000,
            },
        }
    );

    emailWorker.on('completed', (job, result) => {
        console.log(`[EmailWorker] Job ${job.id} completed. MessageId: ${result.messageId}`);
    });

    emailWorker.on('failed', (job, err) => {
        console.error(`[EmailWorker] Job ${job?.id} failed with error: ${err.message}`);
    });

    return emailWorker;
};

export const closeEmailWorker = async (): Promise<void> => {
    if (emailWorker) {
        try {
            await Promise.race([
                emailWorker.close(true),
                new Promise((resolve) => setTimeout(resolve, 500)),
            ]);
        } catch (err) {
            // ignore
        } finally {
            emailWorker = null;
            console.log('[EmailWorker] Stopped worker.');
        }
    }
};
