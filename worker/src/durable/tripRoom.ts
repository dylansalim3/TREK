// Trip-scoped collab room. One Durable Object instance per trip ID.
//
// Replaces server/src/websocket.ts which used `ws` + an in-memory room map.
// Uses the Hibernation API so idle connections don't pin compute time.

import type { Env } from '../types';

interface ClientMeta {
  userId: number;
  username: string;
  joinedAt: number;
}

interface InboundMessage {
  type: string;
  [key: string]: unknown;
}

export class TripRoom {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const userId = Number(url.searchParams.get('userId'));
    const username = url.searchParams.get('username') ?? `user-${userId}`;
    if (!userId) return new Response('Missing userId', { status: 400 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const meta: ClientMeta = { userId, username, joinedAt: Date.now() };
    // Hibernation: attach metadata so we can recover it after eviction.
    this.state.acceptWebSocket(server, [String(userId)]);
    server.serializeAttachment(meta);

    this.broadcast({ type: 'user_joined', userId, username }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    let parsed: InboundMessage;
    try {
      parsed = JSON.parse(message);
    } catch {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
      return;
    }
    const meta = ws.deserializeAttachment() as ClientMeta | null;
    // Re-broadcast to all peers, augmented with sender info.
    this.broadcast(
      { ...parsed, _from: { userId: meta?.userId, username: meta?.username } },
      ws,
    );
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const meta = ws.deserializeAttachment() as ClientMeta | null;
    if (meta) {
      this.broadcast({ type: 'user_left', userId: meta.userId, username: meta.username });
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    // Cloudflare will close the socket; broadcast leave on next close.
    void ws;
  }

  private broadcast(payload: unknown, exclude?: WebSocket): void {
    const text = JSON.stringify(payload);
    for (const ws of this.state.getWebSockets()) {
      if (ws === exclude) continue;
      try {
        ws.send(text);
      } catch {
        // Ignore broken sockets — Cloudflare will reap them.
      }
    }
  }
}
