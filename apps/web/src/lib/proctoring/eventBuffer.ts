export interface ClientProctoringEvent {
  client_event_id: string;
  client_sequence: number;
  kind: string;
  severity: 'info' | 'warning' | 'low' | 'medium' | 'high';
  source: 'browser' | 'system';
  client_timestamp: string;
  session_elapsed_ms: number;
  payload_json: Record<string, unknown>;
}

export class ProctoringEventBuffer {
  private buffer: ClientProctoringEvent[] = [];
  private uploading = false;
  private sessionId: string;
  private uploadUrl: string;

  constructor(sessionId: string, uploadUrl: string) {
    this.sessionId = sessionId;
    this.uploadUrl = uploadUrl;
  }

  addEvent(event: Omit<ClientProctoringEvent, 'client_sequence'>) {
    const nextSeq = this.buffer.length + 1;
    const fullEvent: ClientProctoringEvent = {
      ...event,
      client_sequence: nextSeq,
    };
    this.buffer.push(fullEvent);
    this.triggerUpload();
  }

  getPendingEvents() {
    return [...this.buffer];
  }

  private async triggerUpload() {
    if (this.uploading || this.buffer.length === 0) return;
    this.uploading = true;

    const batch = [...this.buffer];
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ events: batch }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed with HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove the successfully uploaded batch from buffer
      this.buffer = this.buffer.slice(batch.length);
      this.uploading = false;
      
      // If more events were added during the request, process them
      if (this.buffer.length > 0) {
        this.triggerUpload();
      }
    } catch (err) {
      console.warn('[ProctoringEventBuffer] Event batch upload failed, will retry:', err);
      this.uploading = false;
      // Retry in 5 seconds
      setTimeout(() => this.triggerUpload(), 5000);
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ events: this.buffer }),
      });

      if (response.ok) {
        this.buffer = [];
      }
    } catch (err) {
      console.error('[ProctoringEventBuffer] Failed to flush event buffer:', err);
    }
  }
}
