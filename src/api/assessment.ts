import Constants from 'expo-constants';

import type {
  AssessmentAnswerPayload,
  AssessmentNextResponse,
  AssessmentSessionStartResponse,
} from '../shared/assessment';

const manifestBaseUrl =
  (Constants.expoConfig?.extra as { assessmentBaseUrl?: string } | undefined)?.assessmentBaseUrl ||
  (Constants.manifestExtra as { assessmentBaseUrl?: string } | undefined)?.assessmentBaseUrl;

const ASSESSMENT_BASE_URL =
  process.env.EXPO_PUBLIC_ASSESSMENT_BASE_URL || manifestBaseUrl || 'http://localhost:3000';

export async function checkAssessmentHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ASSESSMENT_BASE_URL}/health`);
    if (!res.ok) return false;

    const data = (await res.json()) as { status?: string; ok?: boolean };
    if (data?.status === 'ok') return true;
    if (data?.ok === true) return true;
    return false;
  } catch (err) {
    console.error('Assessment health check failed', err);
    return false;
  }
}

export async function startAssessmentSession(
  version: string = 'v1'
): Promise<AssessmentSessionStartResponse> {
  const res = await fetch(`${ASSESSMENT_BASE_URL}/assessment/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Assessment start error: ${res.status} ${text}`);
  }

  return (await res.json()) as AssessmentSessionStartResponse;
}

export async function sendAssessmentAnswer(
  session_id: string,
  answer: AssessmentAnswerPayload,
  version: string = 'v1'
): Promise<AssessmentNextResponse> {
  const res = await fetch(`${ASSESSMENT_BASE_URL}/assessment/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, version, answer }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Assessment next error: ${res.status} ${text}`);
  }

  return (await res.json()) as AssessmentNextResponse;
}
