import type { SymptomEntities, UserIntent } from '../shared/types';

export function isAcuteReliefReady(intent: UserIntent | null, entities: SymptomEntities): boolean {
  if (intent !== 'acute_relief') return false;
  return entities.missing_fields.length === 0;
}
