import type { SymptomEntities } from '../shared/types';

export const EMPTY_ENTITIES: SymptomEntities = {
  symptom_side: 'unsure',
  symptom_description: [],
  symptom_location: '',
  trigger_activity: [],
  missing_fields: [
    'symptom_side',
    'symptom_description',
    'symptom_location',
    'trigger_activity',
  ],
};
