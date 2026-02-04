
export enum AppMode {
  ANOMALY_HUNTER = 'ANOMALY_HUNTER',
  CHANGE_TRACKER = 'CHANGE_TRACKER'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface AnalysisMetadata {
  latitude?: string;
  longitude?: string;
  date?: string;
  sensorType?: string; // e.g. Optical, SAR, Infrared
  regionName?: string;
}

export interface Anomaly {
  label: string;
  description: string;
  scientificCause: string;
  confidence: number; // 0-100
  box_2d?: number[]; // [ymin, xmin, ymax, xmax]
}

export interface AnomalyResponse {
  anomalies: Anomaly[];
  summary: string;
  verification?: string; // Result from Google Maps Grounding
}

export interface ChangeEvent {
  change_type: string; // e.g. "Deforestation", "Glacial Melt"
  description: string;
  impact: string;
  possibleReason: string;
  estimated_scale: 'Small' | 'Medium' | 'Large';
  confidence: number; // 0-100
  area: string; 
}

export interface ChangeResponse {
  summary: string;
  changes: ChangeEvent[];
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
