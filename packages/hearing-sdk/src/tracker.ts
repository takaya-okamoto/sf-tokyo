import type { HearingSDKConfig, SdkEvent, TodoItem } from "./types";
import { ApiClient } from "./api/client";
import { createClickHandler } from "./events/click";
import { createScrollHandler } from "./events/scroll";
import { createVisibilityHandler } from "./events/visibility";
import { createFloatingButton, removeFloatingButton } from "./ui/floating-button";
import { showRecordingIndicator, removeRecordingIndicator } from "./ui/recording-indicator";
import { createTaskPanel, removeTaskPanel } from "./ui/task-panel";

export class InterviewTracker {
  private config: Required<HearingSDKConfig>;
  private apiClient: ApiClient;
  private eventQueue: SdkEvent[] = [];
  private startTime: number = 0;
  private flushIntervalId: ReturnType<typeof setInterval> | null = null;
  private initialized: boolean = false;
  private returnUrl: string = "";
  private todos: TodoItem[] = [];

  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private scrollHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor(config: HearingSDKConfig) {
    this.config = {
      sessionId: config.sessionId,
      supabaseUrl: config.supabaseUrl,
      debug: config.debug ?? false,
      flushInterval: config.flushInterval ?? 5000,
      buttonText: config.buttonText ?? "Return to Interview",
      buttonPosition: config.buttonPosition ?? "bottom-right",
    };

    this.apiClient = new ApiClient(this.config.supabaseUrl, this.config.debug);
  }

  private log(...args: unknown[]) {
    if (this.config.debug) {
      console.log("[HearingSDK]", ...args);
    }
  }

  private getElapsedMs = (): number => {
    return Date.now() - this.startTime;
  };

  private addEvent = (event: SdkEvent) => {
    this.eventQueue.push(event);
    this.log("Event added:", event.eventType, this.eventQueue.length);
  };

  async init(): Promise<boolean> {
    if (this.initialized) {
      this.log("Already initialized");
      return true;
    }

    this.log("Initializing with sessionId:", this.config.sessionId);

    // コンテキスト取得
    const context = await this.apiClient.getContext(this.config.sessionId);
    if (!context) {
      this.log("Failed to get context");
      return false;
    }

    this.returnUrl = context.returnUrl;
    this.todos = context.todos || [];
    this.startTime = Date.now();

    // イベントハンドラーのセットアップ
    this.clickHandler = createClickHandler(this.addEvent, this.getElapsedMs);
    this.scrollHandler = createScrollHandler(this.addEvent, this.getElapsedMs);
    this.visibilityHandler = createVisibilityHandler(this.addEvent, this.getElapsedMs);

    document.addEventListener("click", this.clickHandler, true);
    window.addEventListener("scroll", this.scrollHandler, { passive: true });
    document.addEventListener("visibilitychange", this.visibilityHandler);

    // 初期イベント
    this.addEvent({
      eventType: "page_view",
      pageUrl: window.location.href,
      pageTitle: document.title,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      elapsedMs: 0,
      timestamp: new Date().toISOString(),
    });

    // 録画インジケーター表示
    showRecordingIndicator();

    // フローティングボタン表示
    this.showFloatingButton();

    // 定期フラッシュ
    this.flushIntervalId = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // ページ離脱時にフラッシュ
    window.addEventListener("beforeunload", () => {
      this.flush();
    });

    this.initialized = true;
    this.log("Initialized successfully");
    return true;
  }

  private showFloatingButton() {
    // タスクパネルを表示（タスクがある場合のみ）
    if (this.todos.length > 0) {
      const taskPanel = createTaskPanel({
        todos: this.todos,
        position: this.config.buttonPosition,
      });
      document.body.appendChild(taskPanel);
    }

    // フローティングボタンを表示
    const button = createFloatingButton({
      text: this.config.buttonText,
      position: this.config.buttonPosition,
      onClick: () => this.handleReturn(),
    });

    document.body.appendChild(button);
  }

  private async handleReturn() {
    this.log("Return button clicked");

    // 戻りイベント記録
    const result = await this.apiClient.markReturned(
      this.config.sessionId,
      window.location.href,
      this.getElapsedMs()
    );

    // 残りのイベントをフラッシュ
    await this.flush();

    // クリーンアップ
    this.destroy();

    // リダイレクト
    const redirectUrl = result?.returnUrl || this.returnUrl;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.log("Flushing events:", events.length);
    await this.apiClient.ingestEvents(this.config.sessionId, events);
  }

  destroy() {
    this.log("Destroying tracker");

    if (this.clickHandler) {
      document.removeEventListener("click", this.clickHandler, true);
    }
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }

    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }

    removeFloatingButton();
    removeTaskPanel();
    removeRecordingIndicator();
    this.initialized = false;
  }
}
