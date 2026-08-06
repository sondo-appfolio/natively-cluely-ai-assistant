/** Phone ↔ desktop command contract for Phone Mirror WebSocket clients. */

export type PhoneCommand =
  | { type: 'chat'; message: string }
  | { type: 'action'; action: string }
  | { type: 'screenshot' }
  | { type: 'two-device-stealth'; op: 'enter' | 'exit' | 'end' }
  | { type: 'listen-transport'; op: 'toggle' | 'pause' | 'resume' }
  | { type: 'end-meeting' }
  | { type: 'ask-submit'; message?: string };

/**
 * Validate a phone WS JSON payload into a PhoneCommand.
 */
export function parsePhoneCommand(cmd: unknown): PhoneCommand | null {
  if (!cmd || typeof cmd !== 'object') return null;
  const c = cmd as Record<string, unknown>;
  if (
    c.type === 'chat' &&
    typeof c.message === 'string' &&
    c.message.trim().length > 0 &&
    c.message.length <= 2000
  ) {
    return { type: 'chat', message: c.message.trim() };
  }
  if (
    c.type === 'action' &&
    typeof c.action === 'string' &&
    /^[a-zA-Z:_-]{1,64}$/.test(c.action)
  ) {
    return { type: 'action', action: c.action };
  }
  if (c.type === 'screenshot') {
    return { type: 'screenshot' };
  }
  if (
    c.type === 'two-device-stealth' &&
    (c.op === 'enter' || c.op === 'exit' || c.op === 'end')
  ) {
    return { type: 'two-device-stealth', op: c.op };
  }
  if (
    c.type === 'listen-transport' &&
    (c.op === 'toggle' || c.op === 'pause' || c.op === 'resume')
  ) {
    return { type: 'listen-transport', op: c.op };
  }
  if (c.type === 'end-meeting') {
    return { type: 'end-meeting' };
  }
  if (c.type === 'ask-submit') {
    if (c.message === undefined) {
      return { type: 'ask-submit' };
    }
    if (typeof c.message !== 'string' || c.message.length > 2000) {
      return null;
    }
    const trimmed = c.message.trim();
    if (trimmed.length === 0) {
      return { type: 'ask-submit' };
    }
    return { type: 'ask-submit', message: trimmed };
  }
  return null;
}

/** Toast/ack payload for listen-transport phone commands (desktop remains host). */
export function formatListenTransportAck(
  op: 'toggle' | 'pause' | 'resume',
  state: string,
): { action: string; message: string } {
  const messages: Record<string, string> = {
    armed: 'Listen resumed',
    paused: 'Listen paused',
    unready: 'Listen unready — configure STT',
    idle: 'Listen idle',
  };
  return {
    action: `listen-transport:${op}`,
    message: messages[state] ?? `Listen ${state}`,
  };
}
