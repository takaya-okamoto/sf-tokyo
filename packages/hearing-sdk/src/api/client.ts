import type {
  SdkEvent,
  ContextResponse,
  IngestResponse,
  MarkReturnedResponse,
} from "../types";

export class ApiClient {
  private supabaseUrl: string;
  private debug: boolean;

  constructor(supabaseUrl: string, debug: boolean = false) {
    this.supabaseUrl = supabaseUrl;
    this.debug = debug;
  }

  private log(...args: unknown[]) {
    if (this.debug) {
      console.log("[HearingSDK]", ...args);
    }
  }

  async getContext(sessionId: string): Promise<ContextResponse | null> {
    try {
      const url = `${this.supabaseUrl}/functions/v1/sdk-context?sessionId=${sessionId}`;
      this.log("Fetching context:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.log("Context error:", errorData);
        return null;
      }

      const data = await response.json();
      this.log("Context received:", data);
      return data;
    } catch (error) {
      this.log("Context fetch failed:", error);
      return null;
    }
  }

  async ingestEvents(
    sessionId: string,
    events: SdkEvent[]
  ): Promise<IngestResponse | null> {
    if (events.length === 0) {
      return { success: true, inserted: 0 };
    }

    try {
      const url = `${this.supabaseUrl}/functions/v1/sdk-ingest-events`;
      this.log("Ingesting events:", events.length);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, events }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.log("Ingest error:", errorData);
        return null;
      }

      const data = await response.json();
      this.log("Ingest success:", data);
      return data;
    } catch (error) {
      this.log("Ingest failed:", error);
      return null;
    }
  }

  async markReturned(
    sessionId: string,
    pageUrl: string,
    elapsedMs: number
  ): Promise<MarkReturnedResponse | null> {
    try {
      const url = `${this.supabaseUrl}/functions/v1/sdk-mark-returned`;
      this.log("Marking returned");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, pageUrl, elapsedMs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.log("Mark returned error:", errorData);
        return null;
      }

      const data = await response.json();
      this.log("Mark returned success:", data);
      return data;
    } catch (error) {
      this.log("Mark returned failed:", error);
      return null;
    }
  }
}
