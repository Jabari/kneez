import assert from 'node:assert';

import { parseSymptomMessage } from '../src/api/nlu.ts';
import { getNextIntakeQuestion } from '../src/logic/getNextIntakeQuestion.ts';
import { EMPTY_ENTITIES } from '../src/logic/emptyEntities.ts';
import type { SymptomEntities } from '../shared/types.ts';

type TestCase = { name: string; fn: () => void | Promise<void> };
const tests: TestCase[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

test('parseSymptomMessage posts message and previous entities and returns parsed entities', async () => {
  const previousEntities: SymptomEntities = {
    symptom_side: 'unsure',
    symptom_description: ['dull ache'],
    symptom_location: 'inside knee',
    trigger_activity: ['stairs'],
    missing_fields: ['symptom_side'],
  };

  const expectedEntities: SymptomEntities = {
    symptom_side: 'right',
    symptom_description: ['dull ache'],
    symptom_location: 'inside knee',
    trigger_activity: ['stairs'],
    missing_fields: [],
  };

  const originalFetch = globalThis.fetch;
  let capturedBody: any;
  let capturedUrl: string | undefined;

  globalThis.fetch = (async (url, options) => {
    capturedUrl = typeof url === 'string' ? url : url.toString();
    capturedBody = options?.body;
    return {
      ok: true,
      status: 200,
      json: async () => ({ entities: expectedEntities }),
      text: async () => '',
    } as any;
  }) as typeof fetch;

  try {
    const result = await parseSymptomMessage('my knee hurts', previousEntities);
    assert.deepStrictEqual(result, expectedEntities);

    assert.ok(capturedUrl?.endsWith('/nlu/symptom-entities'));
    const parsedBody = JSON.parse(capturedBody ?? '{}');
    assert.deepStrictEqual(parsedBody, {
      message: 'my knee hurts',
      previousEntities,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getNextIntakeQuestion prioritizes missing fields order and returns null when complete', () => {
  const needSide: SymptomEntities = {
    ...EMPTY_ENTITIES,
    missing_fields: ['symptom_side', 'symptom_location'],
  };
  assert.strictEqual(
    getNextIntakeQuestion(needSide),
    'Which knee is bothering you — left, right, or both?'
  );

  const needLocation: SymptomEntities = {
    ...EMPTY_ENTITIES,
    symptom_side: 'left',
    missing_fields: ['symptom_location', 'trigger_activity'],
  };
  assert.strictEqual(
    getNextIntakeQuestion(needLocation),
    'Where exactly around your knee do you feel it most (front, back, inside, outside, above/below kneecap)?'
  );

  const needTrigger: SymptomEntities = {
    ...EMPTY_ENTITIES,
    symptom_side: 'left',
    symptom_location: 'front',
    missing_fields: ['trigger_activity', 'symptom_description'],
  };
  assert.strictEqual(
    getNextIntakeQuestion(needTrigger),
    'What movements or activities tend to bring on the pain (running, squats, stairs, etc.)?'
  );

  const needDescription: SymptomEntities = {
    ...EMPTY_ENTITIES,
    symptom_side: 'left',
    symptom_location: 'front',
    trigger_activity: ['running'],
    missing_fields: ['symptom_description'],
  };
  assert.strictEqual(
    getNextIntakeQuestion(needDescription),
    'How would you describe the pain or discomfort (sharp, dull, stiffness, numbness, tingling, popping, etc.)?'
  );

  const complete: SymptomEntities = {
    ...EMPTY_ENTITIES,
    symptom_side: 'left',
    symptom_location: 'front of knee',
    trigger_activity: ['running'],
    symptom_description: ['sharp pain'],
    missing_fields: [],
  };
  assert.strictEqual(getNextIntakeQuestion(complete), null);
});

async function run() {
  let failures = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
    } catch (err) {
      failures += 1;
      console.error(`❌ ${name}`);
      console.error(err);
    }
  }

  if (failures > 0) {
    process.exit(1);
  }
}

run();
