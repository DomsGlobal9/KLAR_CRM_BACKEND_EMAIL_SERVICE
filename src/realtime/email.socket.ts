/**
 * Realtime notification channel for incoming email.
 *
 * This is a delivery mechanism only. The database stays the source of truth:
 * the event is emitted after the row is persisted, carries no state the API
 * cannot also return, and every failure here is swallowed so that a socket
 * problem can never fail email ingestion.
 */
import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { corsOptions } from '../config/cors.config';
import { envConfig } from '../config/env.config';

export const EMAIL_NEW_EVENT = 'email:new';

/**
 * Socket.IO lives under the path the email service is already reached on, so the
 * existing reverse-proxy rule for /api/emails covers the WebSocket upgrade too —
 * no second location block, no second port.
 */
export const EMAIL_SOCKET_PATH = '/api/emails/socket.io';

/**
 * One room for the whole CRM inbox.
 *
 * The existing email APIs return every message to any authenticated CRM user
 * (GET /email/all filters on direction/lead/status — never on user, and incoming
 * rows carry no user_id), so a single shared room mirrors the authorization model
 * that is already in force. Membership is derived from a verified token; nothing
 * a client sends is trusted, so a room name cannot be guessed into.
 */
export const EMAIL_INBOX_ROOM = 'emails:inbox';

export interface SocketUser {
    id: string;
    email?: string;
}

/** Resolves a bearer token to a user, or null when the token is not valid. */
export type TokenVerifier = (token: string) => Promise<SocketUser | null>;

/**
 * Reuses the CRM's own authentication: the same Supabase access token the email
 * APIs already require, verified the same way the main backend verifies it.
 * Returns null when Supabase is not configured, which leaves realtime off rather
 * than letting unauthenticated clients in.
 */
const createSupabaseVerifier = (): TokenVerifier | null => {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = envConfig;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    return async (token: string) => {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return null;
        return { id: data.user.id, email: data.user.email };
    };
};

const readToken = (socket: Socket): string | undefined => {
    const fromAuth = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
        return header.slice('Bearer '.length) || undefined;
    }

    return undefined;
};

/**
 * The list UI renders from these fields. Bodies of attachments, raw headers and
 * the HTML body are deliberately left out: they are large, they are not read by
 * the inbox list, and the detail view already fetches them by id.
 */
const toEventPayload = (email: Record<string, any>) => ({
    id: email.id,
    trackingId: email.trackingId,
    parentTrackingId: email.parentTrackingId ?? null,
    messageId: email.messageId ?? null,
    inReplyTo: email.inReplyTo ?? null,
    direction: email.direction,
    fromEmail: email.fromEmail,
    fromName: email.fromName ?? null,
    toEmail: email.toEmail ?? [],
    ccEmail: email.ccEmail ?? [],
    subject: email.subject ?? '',
    body: email.body ?? '',
    status: email.status,
    leadId: email.leadId ?? null,
    contactId: email.contactId ?? null,
    userId: email.userId ?? null,
    senderName: email.senderName ?? null,
    senderEmail: email.senderEmail ?? null,
    isRead: email.isRead ?? false,
    receivedAt: email.receivedAt ?? null,
    createdAt: email.createdAt ?? null,
    updatedAt: email.updatedAt ?? null,
});

let io: SocketIOServer | null = null;

/**
 * Attaches Socket.IO to the HTTP server the API already listens on.
 * Returns null (realtime disabled) when no token verifier is available, so a
 * missing Supabase configuration degrades to "no realtime" instead of either
 * refusing to boot or accepting anonymous clients.
 */
export const initEmailSocket = (
    httpServer: HttpServer,
    verifyToken: TokenVerifier | null = createSupabaseVerifier()
): SocketIOServer | null => {
    if (io) return io;

    if (!verifyToken) {
        console.warn(
            '[EmailSocket] Disabled: SUPABASE_URL / SUPABASE_ANON_KEY are not set, ' +
            'so socket connections cannot be authenticated. Email ingestion is unaffected.'
        );
        return null;
    }

    io = new SocketIOServer(httpServer, {
        path: EMAIL_SOCKET_PATH,
        cors: corsOptions as any,
    });

    io.use(async (socket, next) => {
        const token = readToken(socket);

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const user = await verifyToken(token);
            if (!user) return next(new Error('Invalid or expired token'));

            socket.data.user = user;
            return next();
        } catch (error: any) {
            console.error('[EmailSocket] Token verification failed:', error?.message);
            return next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const user: SocketUser = socket.data.user;

        socket.join(EMAIL_INBOX_ROOM);
        console.log(`[EmailSocket] Client authenticated and joined ${EMAIL_INBOX_ROOM} (user=${user.id})`);

        socket.on('disconnect', (reason) => {
            console.log(`[EmailSocket] Client disconnected (user=${user.id}, reason=${reason})`);
        });
    });

    console.log(`[EmailSocket] Listening on ${EMAIL_SOCKET_PATH}`);
    return io;
};

/**
 * Announces an email that is already stored. Never throws: realtime delivery is
 * an enhancement on top of a completed database write, so its failure must not
 * unwind the caller.
 */
export const emitIncomingEmail = (email: Record<string, any> | undefined | null): void => {
    if (!io || !email?.id) return;

    try {
        io.to(EMAIL_INBOX_ROOM).emit(EMAIL_NEW_EVENT, {
            type: EMAIL_NEW_EVENT,
            email: toEventPayload(email),
        });
        console.log(`[EmailSocket] ${EMAIL_NEW_EVENT} emitted (id=${email.id}, from=${email.fromEmail})`);
    } catch (error: any) {
        console.error('[EmailSocket] Failed to emit realtime email event:', error?.message);
    }
};

export const closeEmailSocket = async (): Promise<void> => {
    if (!io) return;

    const current = io;
    io = null;

    try {
        await new Promise<void>((resolve) => current.close(() => resolve()));
        console.log('[EmailSocket] Stopped.');
    } catch {
        // Ignore cleanup errors on exit
    }
};
