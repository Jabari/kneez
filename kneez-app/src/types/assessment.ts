export type AssessmentTreeVersion = "v1" | string;

export interface AssessmentSessionStartResponse<NodeType = unknown> {
  session_id: string;
  entry_node: NodeType;
}

export interface AssessmentNextResponse<NodeType = unknown> {
  answers: Record<string, unknown>;
  next: NodeType | null;
  completed: boolean;
}
