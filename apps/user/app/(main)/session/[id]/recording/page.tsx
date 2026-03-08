"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Progress } from "@repo/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { Video, Square, ExternalLink, Clock, AlertCircle, Loader2, Upload } from "lucide-react";

// BroadcastChannel for cross-tab communication
const RECORDING_CHANNEL = 'hearing-recording-channel';

// 状態マシン: 明確な状態遷移で二重実行やレースコンディションを防止
type RecordingState =
  | 'idle'        // 初期状態
  | 'ready'       // ガイダンス表示中（ボタン待ち）
  | 'requesting'  // 画面共有許可を要求中
  | 'recording'   // 録画中
  | 'stopping'    // 停止処理中（二重停止防止）
  | 'uploading'   // アップロード中
  | 'completed'   // 完了、リダイレクト
  | 'waiting'     // 他タブの完了待ち（Return to Interviewから開いた場合）
  | 'error';      // エラー発生

export default function RecordingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // 状態マシン
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [hearingTitle, setHearingTitle] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isInitializedRef = useRef(false);           // React Strict Mode対応
  const recordingStartTimeRef = useRef<number>(0);  // 正確な時間計測
  const pendingBlobRef = useRef<Blob | null>(null); // リトライ用
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStateRef = useRef<RecordingState>('idle'); // イベントハンドラ用

  // 状態とrefを同期
  const updateRecordingState = useCallback((newState: RecordingState) => {
    console.log('[Recording] State:', recordingStateRef.current, '→', newState);
    recordingStateRef.current = newState;
    setRecordingState(newState);
  }, []);

  // ストリームのクリーンアップ
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.onended = null; // ハンドラ削除
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  // 全リソースのクリーンアップ
  const cleanupAll = useCallback(() => {
    cleanupStream();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, [cleanupStream]);

  // MIMEタイプの選択（ブラウザ互換性対応）
  const getSupportedMimeType = useCallback((): string => {
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('[Recording] Using MIME type:', mimeType);
        return mimeType;
      }
    }
    // フォールバック
    console.log('[Recording] Using fallback MIME type: video/webm');
    return 'video/webm';
  }, []);

  // アップロード処理
  const uploadRecording = useCallback(async (blob: Blob, recordingDuration: number) => {
    console.log('[Recording] State: uploading');
    updateRecordingState('uploading');
    setUploadProgress(10);

    const supabase = createBrowserClient();
    const fileName = `recording-${Date.now()}.webm`;
    const storagePath = `${id}/${fileName}`;

    try {
      setUploadProgress(30);

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(storagePath, blob, {
          contentType: "video/webm",
          upsert: false,
        });

      if (uploadError) {
        console.error("[Recording] Upload error:", uploadError);
        throw uploadError;
      }

      setUploadProgress(70);

      // recordingsテーブルにメタデータを保存
      await (supabase.from("recordings") as ReturnType<typeof supabase.from>)
        .insert({
          session_id: id,
          recording_type: "screen",
          storage_path: storagePath,
          duration: recordingDuration,
          file_size: blob.size,
        } as never);

      setUploadProgress(90);

      // セッションステータスを更新
      await (supabase.from("interview_sessions") as ReturnType<typeof supabase.from>)
        .update({
          status: "interview",
        } as never)
        .eq("id", id);

      setUploadProgress(100);
      console.log('[Recording] State: completed');
      updateRecordingState('completed');

      // 少し待ってからリダイレクト
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(`/interview/${id}`);
    } catch (err) {
      console.error("[Recording] Failed to upload recording:", err);
      pendingBlobRef.current = blob; // リトライ用に保持
      setError("録画のアップロードに失敗しました。もう一度お試しください。");
      updateRecordingState('error');
    }
  }, [id, router, updateRecordingState]);

  // 録画終了処理（onstopから呼び出される）
  const handleRecordingEnded = useCallback(async () => {
    // 状態ガード: stoppingでない場合は処理しない
    // （すでにアップロード中等の場合を除外）
    console.log('[Recording] handleRecordingEnded called');

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    console.log("[Recording] Recording saved:", blob.size, "bytes");

    // 正確な経過時間を計算
    const recordingDuration = recordingStartTimeRef.current > 0
      ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
      : duration;

    // クリーンアップ
    chunksRef.current = [];
    cleanupAll();

    // アップロード実行
    await uploadRecording(blob, recordingDuration);
  }, [duration, cleanupAll, uploadRecording]);

  // 録画停止
  const stopRecording = useCallback(async () => {
    // 状態ガード: recordingでない場合は処理しない（refで最新状態をチェック）
    if (recordingStateRef.current !== 'recording') {
      console.log('[Recording] stopRecording ignored: state =', recordingStateRef.current);
      return;
    }

    updateRecordingState('stopping');

    // MediaRecorderを停止（onstopでhandleRecordingEndedが呼ばれる）
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // MediaRecorderが存在しない場合は直接終了処理
      await handleRecordingEnded();
    }

    // ストリームを停止
    cleanupStream();
  }, [updateRecordingState, cleanupStream, handleRecordingEnded]);

  // 録画開始
  const startRecording = useCallback(async (url: string) => {
    // 状態ガード: idle, ready, またはerror以外では開始しない（refで最新状態をチェック）
    const currentState = recordingStateRef.current;
    if (currentState !== 'idle' && currentState !== 'ready' && currentState !== 'error') {
      console.log('[Recording] startRecording ignored: state =', currentState);
      return;
    }

    updateRecordingState('requesting');
    setError("");

    try {
      // 先に画面キャプチャの許可を求める（フォーカスがある状態で）
      // ユーザーには「画面全体」または「ブラウザウィンドウ」を選択してもらう
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor", // 画面全体を推奨
        },
        audio: false,
      });

      // ストリーム検証
      if (!displayStream) {
        throw new Error("画面共有ストリームを取得できませんでした");
      }

      const videoTracks = displayStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error("ビデオトラックが見つかりません");
      }

      streamRef.current = displayStream;

      // MIMEタイプを選択
      const mimeType = getSupportedMimeType();

      // MediaRecorderを設定
      const mediaRecorder = new MediaRecorder(displayStream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[Recording] MediaRecorder onstop fired');
        handleRecordingEnded();
      };

      mediaRecorder.onerror = (event) => {
        console.error('[Recording] MediaRecorder error:', event);
        setError("録画中にエラーが発生しました");
        updateRecordingState('error');
        cleanupAll();
      };

      // 画面共有が停止された場合の処理
      const videoTrack = videoTracks[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('[Recording] Video track ended by user');
          // recordingState が recording の時のみ停止処理
          stopRecording();
        };
      }

      // 録画開始
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();

      console.log('[Recording] State: recording');
      updateRecordingState('recording');
      setDuration(0);

      // 経過時間のインターバル開始
      durationIntervalRef.current = setInterval(() => {
        if (recordingStartTimeRef.current > 0) {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setDuration(elapsed);
        }
      }, 1000);

      // 録画開始後にターゲットサービスを新しいタブで開く
      // 少し待ってから開く（録画が安定するまで）
      setTimeout(() => {
        window.open(url, "_blank");
      }, 300);

    } catch (err) {
      console.error("[Recording] Failed to start recording:", err);
      cleanupAll();

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("画面共有の許可が必要です。「再試行」ボタンをクリックしてください。");
        } else {
          setError(`録画の開始に失敗しました: ${err.message}`);
        }
      } else {
        setError("録画の開始に失敗しました");
      }
      updateRecordingState('error');
    }
  }, [updateRecordingState, getSupportedMimeType, cleanupAll, stopRecording, handleRecordingEnded]);

  // セッション情報を取得して自動的に録画を開始
  useEffect(() => {
    // React Strict Mode対応: 二重実行を防止
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const supabase = createBrowserClient();

    async function fetchAndStart() {
      const { data: sessionData } = await (supabase
        .from("interview_sessions") as ReturnType<typeof supabase.from>)
        .select(`
          *,
          hearing_request:hearing_requests(title, target_url)
        `)
        .eq("id", id)
        .single();

      const session = sessionData as {
        hearing_request: { title: string; target_url: string } | null;
      } | null;

      if (session?.hearing_request) {
        const baseUrl = session.hearing_request.target_url;
        const separator = baseUrl.includes("?") ? "&" : "?";
        const urlWithSessionId = `${baseUrl}${separator}hSessionId=${id}`;
        setTargetUrl(urlWithSessionId);
        setHearingTitle(session.hearing_request.title);

        // ガイダンス表示状態に遷移（ボタンクリックで録画開始）
        updateRecordingState('ready');
      }
    }

    fetchAndStart();
  }, [id, updateRecordingState]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  // BroadcastChannel listener for receiving stop signals from other tabs
  useEffect(() => {
    if (recordingState !== 'recording') return;

    const channel = new BroadcastChannel(RECORDING_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data.type === 'stop' && event.data.sessionId === id) {
        console.log('[Recording] Received stop signal from another tab');
        stopRecording();
      }
    };

    return () => {
      channel.close();
    };
  }, [recordingState, id, stopRecording]);

  // Detect ?action=stop and send stop signal to other tabs
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');

    if (action === 'stop') {
      console.log('[Recording] Detected action=stop, sending stop signal to other tabs');

      // Set this tab to waiting state
      updateRecordingState('waiting');

      // Send stop signal to other tabs
      const channel = new BroadcastChannel(RECORDING_CHANNEL);
      channel.postMessage({ type: 'stop', sessionId: id });
      channel.close();

      // Remove query parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Redirect to interview page after a short delay
      setTimeout(() => {
        router.push(`/interview/${id}`);
      }, 1000);
    }
  }, [id, router, updateRecordingState]);

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleRetry() {
    // pendingBlobがある場合はアップロードをリトライ
    if (pendingBlobRef.current) {
      const blob = pendingBlobRef.current;
      const recordingDuration = recordingStartTimeRef.current > 0
        ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        : duration;
      pendingBlobRef.current = null;
      uploadRecording(blob, recordingDuration);
      return;
    }

    // そうでなければガイダンス画面に戻る
    setError("");
    updateRecordingState('ready');
  }

  // アップロード中の画面
  if (recordingState === 'uploading' || recordingState === 'completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-6">
              <Upload className="h-12 w-12 text-primary animate-pulse" />
              <div className="text-center">
                <p className="text-lg font-medium">
                  {recordingState === 'completed' ? 'アップロード完了' : '録画をアップロード中...'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  このページを閉じないでください
                </p>
              </div>
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {uploadProgress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ガイダンス表示画面（ready状態）
  if (recordingState === 'ready') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-6">
              <Video className="h-12 w-12 text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Ready to Start Recording</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-800 mb-2">
                    Please select the &quot;Entire Screen&quot; tab
                  </p>
                  <p className="text-blue-700">
                    1. Click the button below<br />
                    2. Select the <strong>&quot;Entire Screen&quot;</strong> tab<br />
                    3. Choose your screen and click <strong>&quot;Share&quot;</strong>
                  </p>
                </div>
              </div>
              <Button size="lg" onClick={() => startRecording(targetUrl)}>
                <Video className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 画面共有許可を要求中の画面（requesting）
  if (recordingState === 'requesting' && !error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Select screen sharing permission</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-800 mb-2">
                    Please select the &quot;Entire Screen&quot; tab
                  </p>
                  <p className="text-blue-700">
                    1. Click the <strong>&quot;Entire Screen&quot;</strong> tab at the top<br />
                    2. Select the displayed screen<br />
                    3. Click the <strong>&quot;Share&quot;</strong> button
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  After selection, the service will open automatically in a new tab
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 初期ローディング画面（idle状態）
  if (recordingState === 'idle' && !error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 停止処理中の画面
  if (recordingState === 'stopping') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">録画を停止しています...</p>
              <p className="text-sm text-muted-foreground text-center">
                録画データを処理中です。しばらくお待ちください。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 他タブの録画完了待ち画面（Return to Interviewから開いた場合）
  if (recordingState === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Stopping recording...</p>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while the recording is being saved.<br />
                Redirecting to interview...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hearingTitle}</h1>
        <p className="text-muted-foreground">
          Please verbalize your thoughts while trying the service
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
              <Button onClick={handleRetry} variant="outline" size="sm">
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="order-2 md:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Target Service
            </CardTitle>
            <CardDescription>
              {recordingState === 'recording'
                ? "The service has been opened in a new tab"
                : "Recording will start and open the service"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="block p-4 border rounded-lg bg-muted/50">
              <p className="text-primary truncate">
                {targetUrl}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {recordingState === 'recording' ? "Recording in progress..." : "Waiting to start..."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 md:order-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {recordingState === 'recording' ? (
                <>
                  <Video className="h-5 w-5 text-red-500 animate-pulse" />
                  <span className="text-red-500">Recording</span>
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  <span>Ready to Record</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-3xl font-mono">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <span>{formatDuration(duration)}</span>
            </div>

            {recordingState === 'recording' ? (
              <Button
                className="w-full"
                size="lg"
                variant="destructive"
                onClick={stopRecording}
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording & Go to Interview
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleRetry}
              >
                <Video className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            )}

            {recordingState === 'recording' && (
              <p className="text-sm text-muted-foreground text-center">
                Press &quot;Stop Recording&quot; when you finish trying the service
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {recordingState === 'recording' && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Recording screen. Please verbalize your thoughts while using the service.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
