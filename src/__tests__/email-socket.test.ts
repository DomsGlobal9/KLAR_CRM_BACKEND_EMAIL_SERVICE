/**
 * Realtime email channel tests. Uses node:test (no test framework dependency)
 * and a real Socket.IO server/client pair over loopback.
 *
 * The token verifier is injected, so these tests never call Supabase; what is
 * being verified is the service's own behaviour — who is let in, who is not, and
 * what a connected client receives.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Configuration is resolved at import time and dotenv never overrides values
 * that are already set, so these placeholders keep the module loadable on a
 * machine or CI runner without a .env. Nothing here opens a database, an AWS
 * connection, or a Supabase connection.
 */
process.env.NODE_ENV ||= 'test';
process.env.AWS_ACCESS_KEY ||= 'test-key';
process.env.AWS_SECRET_KEY ||= 'test-secret';
process.env.AWS_REGION ||= 'ap-south-1';
process.env.AWS_BUCKET_NAME ||= 'test-bucket';
process.env.EMAIL_DOMAIN ||= 'example.com';
process.env.SES_FROM_EMAIL ||= 'noreply@example.com';

// Required after the environment above is in place.
const {
    initEmailSocket,
    closeEmailSocket,
    emitIncomingEmail,
    EMAIL_NEW_EVENT,
    EMAIL_SOCKET_PATH,
    EMAIL_INBOX_ROOM,
} = require('../realtime/email.socket') as typeof import('../realtime/email.socket');

const { io: ioClient } = require('socket.io-client') as typeof import('socket.io-client');

type ClientSocket = ReturnType<typeof ioClient>;

const VALID_TOKEN = 'valid-access-token';

const verifyToken = async (token: string) =>
    token === VALID_TOKEN ? { id: 'user-1', email: 'rm@example.com' } : null;

/** A persisted row as the repository returns it. */
const storedEmail = {
    id: 'a1b2c3',
    trackingId: 'track-1',
    messageId: '<msg-1@example.com>',
    direction: 'incoming',
    fromEmail: 'customer@example.com',
    fromName: 'Customer',
    toEmail: ['support@example.com'],
    subject: 'Booking question',
    body: 'Is the trip still available?',
    htmlBody: '<p>Is the trip still available?</p>',
    attachments: [{ filename: 'passport.pdf', content: 'data:application/pdf;base64,AAAA' }],
    rawHeaders: { received: 'from mail.example.com' },
    status: 'received',
    isRead: false,
    createdAt: new Date('2026-08-17T10:00:00Z'),
};

const waitFor = <T>(socket: ClientSocket, event: string, timeoutMs = 3000): Promise<T> =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), timeoutMs);
        socket.once(event as any, (payload: T) => {
            clearTimeout(timer);
            resolve(payload);
        });
    });

describe('email realtime channel', () => {
    let httpServer: HttpServer;
    let io: ReturnType<typeof initEmailSocket>;
    let url: string;
    const clients: ClientSocket[] = [];

    const connect = (auth?: Record<string, unknown>): ClientSocket => {
        const socket = ioClient(url, {
            path: EMAIL_SOCKET_PATH,
            auth,
            transports: ['websocket'],
            reconnection: false,
        });
        clients.push(socket);
        return socket;
    };

    /** Resolves once the server has finished its own connection handling (room join included). */
    const serverAccepted = (): Promise<void> =>
        new Promise((resolve) => io!.once('connection', () => resolve()));

    beforeEach(async () => {
        httpServer = createServer();
        await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
        url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
        io = initEmailSocket(httpServer, verifyToken);
    });

    afterEach(async () => {
        for (const client of clients.splice(0)) client.disconnect();
        await closeEmailSocket();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    });

    test('an authenticated client connects and joins the inbox room', async () => {
        const client = connect({ token: VALID_TOKEN });
        const accepted = serverAccepted();

        await waitFor(client, 'connect');
        await accepted;

        assert.equal(io!.sockets.adapter.rooms.get(EMAIL_INBOX_ROOM)?.size, 1);
    });

    test('a connection without a token is rejected', async () => {
        const client = connect();
        const error = await waitFor<Error>(client, 'connect_error');

        assert.equal(error.message, 'Authentication required');
        assert.equal(client.connected, false);
    });

    test('a connection with an invalid token is rejected', async () => {
        const client = connect({ token: 'forged-token' });
        const error = await waitFor<Error>(client, 'connect_error');

        assert.equal(error.message, 'Invalid or expired token');
        assert.equal(client.connected, false);
    });

    test('a stored email is delivered to authenticated clients', async () => {
        const client = connect({ token: VALID_TOKEN });
        const accepted = serverAccepted();
        await waitFor(client, 'connect');
        await accepted;

        const received = waitFor<any>(client, EMAIL_NEW_EVENT);
        emitIncomingEmail(storedEmail);
        const payload = await received;

        assert.equal(payload.type, EMAIL_NEW_EVENT);
        assert.equal(payload.email.id, storedEmail.id);
        assert.equal(payload.email.subject, storedEmail.subject);
        assert.equal(payload.email.fromEmail, storedEmail.fromEmail);
        assert.equal(payload.email.direction, 'incoming');
        assert.equal(payload.email.isRead, false);
        assert.deepEqual(payload.email.toEmail, storedEmail.toEmail);
        assert.equal(new Date(payload.email.createdAt).toISOString(), storedEmail.createdAt.toISOString());
    });

    test('the payload carries no attachments, HTML body or raw headers', async () => {
        const client = connect({ token: VALID_TOKEN });
        const accepted = serverAccepted();
        await waitFor(client, 'connect');
        await accepted;

        const received = waitFor<any>(client, EMAIL_NEW_EVENT);
        emitIncomingEmail(storedEmail);
        const { email } = await received;

        assert.equal(email.attachments, undefined);
        assert.equal(email.htmlBody, undefined);
        assert.equal(email.rawHeaders, undefined);
    });

    test('a rejected client receives no email events', async () => {
        const client = connect({ token: 'forged-token' });
        await waitFor(client, 'connect_error');

        let delivered = false;
        client.on(EMAIL_NEW_EVENT, () => { delivered = true; });

        emitIncomingEmail(storedEmail);
        await new Promise((resolve) => setTimeout(resolve, 300));

        assert.equal(delivered, false);
        assert.equal(io!.sockets.adapter.rooms.get(EMAIL_INBOX_ROOM), undefined);
    });

    test('emitting without a persisted id does nothing', () => {
        assert.doesNotThrow(() => emitIncomingEmail({} as any));
        assert.doesNotThrow(() => emitIncomingEmail(null));
    });
});

describe('email realtime channel when it is not running', () => {
    test('initialisation is skipped when no token verifier is available', async () => {
        const httpServer = createServer();
        await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));

        try {
            // Realtime must never fall back to accepting unauthenticated clients.
            assert.equal(initEmailSocket(httpServer, null), null);
        } finally {
            await closeEmailSocket();
            await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        }
    });

    test('emitting is a no-op, so email persistence is never affected', () => {
        assert.doesNotThrow(() => emitIncomingEmail(storedEmail));
    });
});
