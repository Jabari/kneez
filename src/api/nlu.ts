import Constants from 'expo-constants';
import type { SymptomEntities } from '../shared/types';

const manifestBaseUrl =
  (Constants.expoConfig?.extra as { nluBaseUrl?: string } | undefined)?.nluBaseUrl ||
  (Constants.manifestExtra as { nluBaseUrl?: string } | undefined)?.nluBaseUrl;

const BASE_URL =
  process.env.EXPO_PUBLIC_NLU_BASE_URL || manifestBaseUrl || 'http://localhost:4000';

export async function parseSymptomMessage(
  message: string,
  previousEntities?: SymptomEntities
): Promise<SymptomEntities> {
  const res = await fetch(`${BASE_URL}/nlu/symptom-entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, previousEntities }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NLU error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.entities as SymptomEntities;
}
