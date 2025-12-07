import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';

import type {
  IntentClassification,
  SymptomEntities,
  SymptomFieldName,
} from './shared/types';

type SymptomRequestBody = {
  message?: unknown;
  previousEntities?: Partial<SymptomEntities>;
};

const PORT = Number(process.env.PORT) || 4000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '⚠️  OPENAI_API_KEY is not set. Set it in your environment before running the server.'
  );
}

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

const intentSchema = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: ['red_flag', 'acute_relief', 'rehab_request', 'general_education', 'out_of_scope'],
    },
  },
  required: ['intent'],
  additionalProperties: false,
};

const intentRouterPrompt = `System prompt (for the router LLM)
You are a routing classifier for the Kneez app. Your ONLY job is to decide the user’s intent from their first message and output a single JSON object. Do not answer the question or give advice. Return only valid JSON with a single property, intent, whose value is one of the allowed strings below. No extra text.

Decision rules (apply in this order; the first match wins):

red_flag – Any red-flag symptoms (e.g., recent major trauma, audible pop with immediate swelling and inability to bear weight, severe deformity, fever with hot/red joint, suspected infection, foot/calf swelling with shortness of breath, numbness with loss of bladder/bowel control).

acute_relief – The user reports knee symptoms during a specific activity and seems to want immediate relief (e.g., “my left knee hurts when I squat/go upstairs/run”).

rehab_request – The user asks for stretching, mobility, or strengthening plans, long-term fixes, rehab programs, or prevention (not immediate symptom relief).

general_education – Curiosity/learning questions about knee anatomy, knee symptom causes, diagnoses, imaging, timelines, what a knee structure is/does, anything knee-related, without asking for a symptom fix.

out_of_scope – Not about knees, or unrelated.

Allowed intent string values:

"red_flag"

"acute_relief"

"rehab_request"

"general_education"

"out_of_scope"

Output format: {"intent":"<one of the above>"}
No other keys. No explanations. Always valid JSON.

User prompt template (what you send with the user’s message)
Classify the user’s intent for routing. Remember: return only the JSON object with intent.

User message:
{USER_MESSAGE_GOES_HERE}
Quick examples (for your tests)
“the back of my right knee hurts when I go downstairs” → {"intent":"acute_relief"}

“what is the muscle above the knee called?” → {"intent":"general_education"}

“what stretches can I do to fix runner’s knee long term?” → {"intent":"long_term_solution"}

“I heard a pop, can’t put weight on it, knee looks crooked” → {"intent":"emergency_red_flag"}

“my shoulder hurts when benching” → {"intent":"out_of_scope"}

Tips to make this work reliably
Precedence matters: run the red-flag check first so emergencies never get misrouted.

Keep it JSON-only: in your calling code, reject and re-ask if the response isn’t valid JSON with only intent.

Guardrails: temperature ≤ 0.2; top_p ≤ 0.2 to keep outputs deterministic.

Telemetry: log the raw user message + classified intent to spot drift and refine prompts later.`;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/nlu/intent', async (req, res) => {
  try {
    const { message } = req.body as { message?: unknown };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const userPrompt = `Classify the user’s intent for routing. Remember: return only the JSON object with intent.\n\nUser message:\n${message}`;

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      top_p: 0.2,
      input: [
        { role: 'system', content: intentRouterPrompt },
        { role: 'user', content: userPrompt },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'intent_router',
          strict: true,
          schema: intentSchema,
        },
      },
    });

    const raw = response.output_text;
    console.log('[intent-router]', { message, raw });

    let parsed: IntentClassification;
    try {
      parsed = JSON.parse(raw) as IntentClassification;
    } catch (e) {
      console.error('Failed to parse intent JSON. Raw output:', raw);
      return res.status(500).json({ error: 'Failed to parse intent' });
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('Intent router error', err);
    return res.status(500).json({
      error: 'Intent router failed',
      details: err?.message ?? 'unknown error',
    });
  }
});

app.post('/nlu/symptom-entities', async (req, res) => {
  try {
    const { message, previousEntities } = req.body as {
      message: string;
      previousEntities?: Partial<SymptomEntities>;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

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

    const userPrompt = `User message: """${message}"""`;

    const response = await openai.responses.create({
      model: 'gpt-5-mini-2025-08-07', // or gpt-4o-mini etc, whatever you're using
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // 👇 THIS is the correct way to do JSON schema with Responses API
      text: {
        format: {
          type: 'json_schema',
          name: 'symptom_entities',
          strict: true,
          schema: symptomSchema,
        },
      },
    });

    // With text.format set, output_text will be a JSON string matching our schema
    const raw = response.output_text;

    let parsed: SymptomEntities;
    try {
      parsed = JSON.parse(raw) as SymptomEntities;
    } catch (e) {
      console.error('Failed to parse symptom entities JSON. Raw output:', raw);
      return res.status(500).json({ error: 'Failed to parse symptom entities' });
    }

    const merged = mergeSymptomEntities(previousEntities, parsed);
    return res.json({ entities: merged });
  } catch (err: any) {
    console.error('NLU error', err);
    return res.status(500).json({
      error: 'NLU failed',
      details: err?.message ?? 'unknown error',
    });
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
