export type AssessmentTreeVersion = "v1" | string;

export type Condition =
  | { type: "always" }
  | { type: "equals"; key: string; value: string | number | boolean }
  | { type: "in"; key: string; values: Array<string | number | boolean> }
  | { type: "range"; key: string; min?: number; max?: number };

export interface BranchRule {
  condition: Condition;
  next_node_id: string;
}

export interface BaseAssessmentNode {
  id: string;
  type: "question" | "movement_test" | "assessment";
  title: string;
  description?: string;
  next?: BranchRule[] | null;
}

export interface QuestionOption {
  id: string;
  label: string;
  value?: string | number | boolean;
  description?: string;
}

export interface QuestionNode extends BaseAssessmentNode {
  type: "question";
  question: string;
  save_to?: string;
  options?: QuestionOption[];
  source?: string;
}

export interface MovementTestNode extends BaseAssessmentNode {
  type: "movement_test";
  prompt: string;
  metric_key: string;
  success_label?: string;
  failure_label?: string;
}

export interface Recommendation {
  title: string;
  summary?: string;
  video_id?: string;
}

export interface AssessmentNode extends BaseAssessmentNode {
  type: "assessment";
  summary: string;
  explanation?: string;
  region_id?: string;
  confidence?: number;
  recommendations?: Recommendation[];
}

export type AssessmentNodePayload = QuestionNode | MovementTestNode | AssessmentNode;

export interface AnswerPayload {
  node_id: string;
  // The remainder of the payload is node-specific (option id, metric result, etc.).
  [key: string]: unknown;
}

export interface AssessmentNextRequest {
  session_id: string;
  version?: AssessmentTreeVersion;
  answer: AnswerPayload;
}

export interface AssessmentSessionStartResponse {
  session_id: string;
  node: AssessmentNodePayload;
}

export interface AssessmentNextResponse<NodeType = AssessmentNodePayload> {
  session_id: string;
  answers: Record<string, unknown>;
  next_node: NodeType | null;
  completed: boolean;
}
