# F5 — MCP fetch-based transport

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** —
**Blocked by:** none
**Blocks:** none

## Goal

`@modelcontextprotocol/sdk` ships a Node `http`-based transport that won't
run on Workers. Implement a fetch/SSE adapter so the MCP endpoint works on
the Worker.

## Scope

- [ ] `worker/src/mcp/transport.ts`: a `WorkerSseTransport` implementing
      the MCP `Transport` interface using `Response` streams.
- [ ] `worker/src/routes/mcp.ts`: mount `/mcp` with the existing tool
      registrations from `server/src/mcp/*` (port unchanged where
      possible).
- [ ] Session state for SSE connections lives in a Durable Object
      (`McpSession`) — one per session.
- [ ] Tests: `app.fetch(new Request('/mcp', { headers: { Accept: 'text/event-stream' }}))`
      returns a stream and the first event is the `initialize` response.
- [ ] If the MCP SDK's `Transport` shape proves incompatible, document
      Workers-MCP as a degraded mode and skip — see PRD §"Risk callouts".

## Source references

- Express MCP: `server/src/mcp/server.ts`, `server/src/routes/mcp.ts`
- MCP SDK: `@modelcontextprotocol/sdk`

## Done-when

An MCP client (e.g. Claude Code with `mcp.json` pointing at the dev Worker)
can list and invoke tools.
