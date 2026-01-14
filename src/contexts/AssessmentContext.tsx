import React, { createContext, useContext, useMemo, useState } from 'react';

import type { AssessmentNodePayload } from '../shared/assessment';

type AssessmentContextValue = {
  isServerHealthy: boolean | null;
  setServerHealthy: (healthy: boolean) => void;
  sessionId: string | null;
  currentNode: AssessmentNodePayload | null;
  setCurrentNode: (node: AssessmentNodePayload | null) => void;
  setSession: (sessionId: string, node: AssessmentNodePayload) => void;
  resetSession: () => void;
};

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentNode, setCurrentNode] = useState<AssessmentNodePayload | null>(null);

  const setSession = (id: string, node: AssessmentNodePayload) => {
    setSessionId(id);
    setCurrentNode(node);
  };

  const resetSession = () => {
    setSessionId(null);
    setCurrentNode(null);
  };

  const value = useMemo(
    () => ({
      isServerHealthy,
      setServerHealthy: setIsServerHealthy,
      sessionId,
      currentNode,
      setCurrentNode,
      setSession,
      resetSession,
    }),
    [isServerHealthy, sessionId, currentNode, setCurrentNode]
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}
