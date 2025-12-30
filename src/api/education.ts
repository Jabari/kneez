import Constants from 'expo-constants';
import type { ChatTurn } from '../shared/types';

const manifestBaseUrl =
  (Constants.expoConfig?.extra as { nluBaseUrl?: string } | undefined)?.nluBaseUrl ||
  (Constants.manifestExtra as { nluBaseUrl?: string } | undefined)?.nluBaseUrl;

const BASE_URL =
  process.env.EXPO_PUBLIC_NLU_BASE_URL || manifestBaseUrl || 'http://localhost:3000';

export async function requestEducationalReply(
  message: string,
  history: ChatTurn[]
): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/education`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Education chat error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { reply: string };
  return data.reply;
}
