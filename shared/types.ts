export interface Tree {
  treeId: string;
  species: string;
  street: string;
}

export interface Observation {
  id: number;
  treeId: string;
  observationDate: string;
  tension: number;
  tiltAngle: number;
}

export interface TreeAnalysis {
  treeId: string;
  species: string;
  street: string;
  correlationCoefficient: number;
  observationCount: number;
  firstTiltAngle: number;
  lastTiltAngle: number;
  tiltAngleIncrease: number;
  isSuspected: boolean;
  observations: { tension: number; tiltAngle: number; observationDate: string }[];
}

export interface AnalysisRequest {
  streets?: string[];
  startDate?: string;
  endDate?: string;
}

export interface AnalysisResponse {
  trees: TreeAnalysis[];
  suspectedTrees: TreeAnalysis[];
  statistics: {
    totalTrees: number;
    totalObservations: number;
    suspectedCount: number;
    avgCorrelation: number;
  };
}

export interface ImportObservation {
  treeId: string;
  observationDate: string;
  tension: number;
  tiltAngle: number;
}

export interface ImportResponse {
  success: boolean;
  importedCount: number;
  errors: string[];
}
