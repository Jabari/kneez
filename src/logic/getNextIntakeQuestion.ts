import type { SymptomEntities } from '../shared/types';

export function getNextIntakeQuestion(entities: SymptomEntities): string | null {
  const missing = entities.missing_fields;

  if (missing.includes('symptom_side')) {
    return 'Which knee is bothering you — left, right, or both?';
  }
  if (missing.includes('symptom_location')) {
    return 'Where exactly around your knee do you feel it most (front, back, inside, outside, above/below kneecap)?';
  }
  if (missing.includes('trigger_activity')) {
    return 'What movements or activities tend to bring on the pain (running, squats, stairs, etc.)?';
  }
  if (missing.includes('symptom_description')) {
    return 'How would you describe the pain or discomfort (sharp, dull, stiffness, numbness, tingling, popping, etc.)?';
  }

  return null;
}
