export type SymptomSide = 'left' | 'right' | 'both' | 'unsure';

export type UserIntent =
  | 'red_flag'
  | 'acute_relief'
  | 'rehab_request'
  | 'general_education'
  | 'out_of_scope';

export type IntentClassification = {
  intent: UserIntent;
};

export type SymptomFieldName =
  | 'symptom_side'
  | 'symptom_description'
  | 'symptom_location'
  | 'trigger_activity';

export type SymptomEntities = {
  symptom_side: SymptomSide;
  // Short phrases describing symptoms: ['sharp pain', 'stiff', 'numb', 'tingling']
  symptom_description: string[];
  // Concise free-text description: "behind right kneecap", "outside of left knee"
  symptom_location: string;
  // Activities that trigger/worsen pain: ['running', 'deep squats', 'walking downstairs']
  trigger_activity: string[];
  // Field names that the system still doesn’t have confident info for
  missing_fields: SymptomFieldName[];
};
