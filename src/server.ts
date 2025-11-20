import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { OpenAI } from 'openai';
import type { SymptomEntities, SymptomFieldName } from '../shared/types';

if (typeof globalThis.ReadableStream === 'undefined') {
  (globalThis as typeof globalThis & { ReadableStream: typeof NodeReadableStream }).ReadableStream =
    NodeReadableStream as unknown as typeof globalThis.ReadableStream;
}

type SymptomRequestBody = {
  message?: unknown;
  previousEntities?: Partial<SymptomEntities>;
};

const PORT = Number(process.env.PORT) || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const systemPrompt = `
You are Kneez, an expert knee pain intake assistant.

Your job:
- Read the user's message describing knee symptoms.
- Extract these fields:
  - symptom_side: "left", "right", "both", or "unsure" if not clearly stated.
  - symptom_description: array of short phrases describing symptoms
    (e.g. ["sharp pain", "stiff", "numb", "tingling", "popping"]).
  - symptom_location: concise description of where on/around the knee
    (e.g. "behind right kneecap", "outside of left knee", "below left kneecap").
  - trigger_activity: array of activities that trigger or worsen pain
    (e.g. ["running", "deep squats", "walking upstairs"]).
- If you cannot confidently determine a field, leave it generic and mark that field name in missing_fields.
- missing_fields: list every field where information is missing, ambiguous, or conflicting.

Do NOT make up very specific details that are not implied by the user.
If the user does not mention side, use "unsure" and mark "symptom_side" as missing.
Always return valid JSON strictly matching the schema.
`;

const symptomSchema = {
  type: 'object',
  properties: {
    symptom_side: {
      type: 'string',
      description: 'Which knee(s) are affected',
      enum: ['left', 'right', 'both', 'unsure'],
    },
    symptom_description: {
      type: 'array',
      description: 'Key words/phrases describing symptoms',
      items: { type: 'string' },
    },
    symptom_location: {
      type: 'string',
      description: 'Concise natural language location description',
    },
    trigger_activity: {
      type: 'array',
      description: 'Activities or movements that trigger or worsen symptoms',
      items: { type: 'string' },
    },
    missing_fields: {
      type: 'array',
      description: 'Fields that could not be confidently extracted',
      items: {
        type: 'string',
        enum: [
          'symptom_side',
          'symptom_description',
          'symptom_location',
          'trigger_activity',
        ],
      },
    },
  },
  required: [
    'symptom_side',
    'symptom_description',
    'symptom_location',
    'trigger_activity',
    'missing_fields',
  ],
  additionalProperties: false,
};

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/nlu/symptom-entities', async (
  req: Request<unknown, unknown, SymptomRequestBody>,
  res: Response
) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const { message, previousEntities } = (req.body ?? {}) as SymptomRequestBody;

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required' });
    }

    const userPrompt = `User message: """${message}"""`;

    const response = await (openai as any).responses.create({
      model: 'gpt-5.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'symptom_entities',
          schema: symptomSchema,
          strict: true,
        },
      },
    } as any);

    const raw =
      (response as any).output_text ??
      (response as any).output?.[0]?.content?.[0]?.text;

    if (typeof raw !== 'string' || raw.trim().length === 0) {
      throw new Error('LLM response missing expected JSON payload');
    }

    const parsed = JSON.parse(raw) as SymptomEntities;
    const merged = mergeSymptomEntities(previousEntities, parsed);

    res.json({ entities: merged });
  } catch (error) {
    console.error('Failed to parse symptom entities', error);
    res.status(500).json({ error: 'Failed to parse symptom entities' });
  }
});

app.listen(PORT, () => {
  console.log(`NLU server listening on port ${PORT}`);
});

function mergeSymptomEntities(
  previous: Partial<SymptomEntities> | undefined,
  current: SymptomEntities
): SymptomEntities {
  if (!previous) {
    return normalizeEntities(current);
  }

  const symptom_side =
    previous.symptom_side && previous.symptom_side !== 'unsure'
      ? previous.symptom_side
      : current.symptom_side;

  const symptom_description = Array.from(
    new Set([...(previous.symptom_description ?? []), ...current.symptom_description])
  ).filter((item) => item && item.trim().length > 0);

  const symptom_location =
    previous.symptom_location && previous.symptom_location.trim().length > 0
      ? previous.symptom_location
      : current.symptom_location;

  const trigger_activity = Array.from(
    new Set([...(previous.trigger_activity ?? []), ...current.trigger_activity])
  ).filter((item) => item && item.trim().length > 0);

  const missing_fields: SymptomFieldName[] = [];
  if (!symptom_side || symptom_side === 'unsure') missing_fields.push('symptom_side');
  if (symptom_description.length === 0) missing_fields.push('symptom_description');
  if (!symptom_location || symptom_location.trim().length === 0)
    missing_fields.push('symptom_location');
  if (trigger_activity.length === 0) missing_fields.push('trigger_activity');

  return {
    symptom_side,
    symptom_description,
    symptom_location,
    trigger_activity,
    missing_fields,
  };
}

function normalizeEntities(entities: SymptomEntities): SymptomEntities {
  const symptom_description = (entities.symptom_description ?? []).filter(
    (item) => item && item.trim().length > 0
  );
  const trigger_activity = (entities.trigger_activity ?? []).filter(
    (item) => item && item.trim().length > 0
  );

  const missing_fields: SymptomFieldName[] = [];
  if (!entities.symptom_side || entities.symptom_side === 'unsure') {
    missing_fields.push('symptom_side');
  }
  if (symptom_description.length === 0) {
    missing_fields.push('symptom_description');
  }
  if (!entities.symptom_location || entities.symptom_location.trim().length === 0) {
    missing_fields.push('symptom_location');
  }
  if (trigger_activity.length === 0) {
    missing_fields.push('trigger_activity');
  }

  return {
    symptom_side: entities.symptom_side,
    symptom_description,
    symptom_location: entities.symptom_location,
    trigger_activity,
    missing_fields,
  };
}
