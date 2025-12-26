import Constants from 'expo-constants';
import type { IntentClassification } from '../shared/types';

const manifestBaseUrl =
  (Constants.expoConfig?.extra as { nluBaseUrl?: string } | undefined)?.nluBaseUrl ||
  (Constants.manifestExtra as { nluBaseUrl?: string } | undefined)?.nluBaseUrl;

const BASE_URL =
  process.env.EXPO_PUBLIC_NLU_BASE_URL || manifestBaseUrl || 'http://localhost:3000';

export async function classifyIntent(message: string): Promise<IntentClassification> {
  const res = await fetch(`${BASE_URL}/nlu/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Intent router error: ${res.status} ${text}`);
  }

  return (await res.json()) as IntentClassification;
}
