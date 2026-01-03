import type { SymptomEntities, SymptomFieldName } from '../shared/types';

export function normalizeSymptomLocation(raw?: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower === 'unspecified') return '';

  return trimmed;
}

export function normalizeEntities(entities: SymptomEntities): SymptomEntities {
  const symptom_description = (entities.symptom_description ?? []).filter(
    (item) => item && item.trim().length > 0
  );
  const trigger_activity = (entities.trigger_activity ?? []).filter(
    (item) => item && item.trim().length > 0
  );

  const symptom_location = normalizeSymptomLocation(entities.symptom_location);

  const missing_fields: SymptomFieldName[] = [];
  if (!entities.symptom_side || entities.symptom_side === 'unsure') {
    missing_fields.push('symptom_side');
  }
  if (symptom_description.length === 0) {
    missing_fields.push('symptom_description');
  }
  if (!symptom_location) {
    missing_fields.push('symptom_location');
  }
  if (trigger_activity.length === 0) {
    missing_fields.push('trigger_activity');
  }

  return {
    symptom_side: entities.symptom_side,
    symptom_description,
    symptom_location,
    trigger_activity,
    missing_fields,
  };
}

export function mergeSymptomEntities(
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

  const previousLocation = normalizeSymptomLocation(previous.symptom_location);
  const currentLocation = normalizeSymptomLocation(current.symptom_location);
  const symptom_location = previousLocation || currentLocation;

  const trigger_activity = Array.from(
    new Set([...(previous.trigger_activity ?? []), ...current.trigger_activity])
  ).filter((item) => item && item.trim().length > 0);

  const missing_fields: SymptomFieldName[] = [];
  if (!symptom_side || symptom_side === 'unsure') missing_fields.push('symptom_side');
  if (symptom_description.length === 0) missing_fields.push('symptom_description');
  if (!symptom_location) missing_fields.push('symptom_location');
  if (trigger_activity.length === 0) missing_fields.push('trigger_activity');

  return {
    symptom_side,
    symptom_description,
    symptom_location,
    trigger_activity,
    missing_fields,
  };
}
