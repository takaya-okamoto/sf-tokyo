export interface HearingSDKConfig {
  sessionId: string;
  supabaseUrl: string;
  debug?: boolean;
  flushInterval?: number;
  buttonText?: string;
  buttonPosition?: "bottom-right" | "bottom-left";
}

export interface SdkEvent {
  eventType: string;
  targetSelector?: string;
  pageUrl: string;
  pageTitle?: string;
  scrollDepth?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  xPosition?: number;
  yPosition?: number;
  elapsedMs: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TodoItem {
  id: string;
  content: string;
  sort_order: number;
}

export interface ContextResponse {
  sessionId: string;
  status: string;
  returnUrl: string;
  hearingTitle: string | null;
  todos: TodoItem[];
}

export interface IngestResponse {
  success: boolean;
  inserted: number;
}

export interface MarkReturnedResponse {
  success: boolean;
  returnUrl: string;
}
