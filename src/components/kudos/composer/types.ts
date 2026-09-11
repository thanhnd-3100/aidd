/**
 * Composer integration contract types (Figma "Viết KUDO" modal, node
 * 520:11647 — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2).
 *
 * Presentational only: `KudosComposer` never fetches recipients or submits —
 * it calls back into the parent (Phase I1 wires Phase B1's server actions).
 */
export type RecipientOption = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type KudosComposerSubmitPayload = {
  recipientId: string;
  content: string;
  hashtags: string[];
};
