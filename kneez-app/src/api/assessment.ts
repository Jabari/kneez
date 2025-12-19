export const ASSESSMENT_ENDPOINTS = {
  health: "/health",
  kneeRegions: "/assessment/knee-regions",
  tree: "/assessment/tree",
  start: "/assessment/start",
  next: "/assessment/next",
};

/**
 * POST /assessment/next contract:
 * - Request body: { session_id: string; version?: string; answer: { node_id: string; ...nodeSpecificPayload } }
 * - Success response: {
 *     session_id: string;
 *     answers: Record<string, unknown>;
 *     next_node: AssessmentNodePayload | null;
 *     completed: boolean; // true when next_node?.type === "assessment"
 *   }
 * - Error responses:
 *   - 400 when session_id or answer.node_id is missing, the version mismatches the active session, or the answer references an unknown node.
 *   - 404 when the session is not found.
 *
 * See src/types/assessment.ts for the exact shapes used by the front-end.
 */
