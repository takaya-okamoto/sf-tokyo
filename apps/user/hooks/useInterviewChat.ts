"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { UIMessage } from "ai";

interface UseInterviewChatOptions {
  sessionId: string;
  onMessagesLoaded?: () => void;
}

interface DBMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

// Helper to extract text content from UIMessage
export function getMessageText(message: UIMessage): string {
  if (!message.parts) {
    return "";
  }
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

// Helper to create a UIMessage-compatible object from DB message
function createUIMessage(dbMessage: DBMessage): UIMessage {
  return {
    id: dbMessage.id,
    role: dbMessage.role as "user" | "assistant",
    parts: [{ type: "text", text: dbMessage.content }],
  };
}

export function useInterviewChat({
  sessionId,
  onMessagesLoaded,
}: UseInterviewChatOptions) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const pendingUserMessageRef = useRef<string | null>(null);
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const saveMessageToDB = useCallback(
    async (message: { role: string; content: string; id?: string }) => {
      // Skip if already saved
      if (message.id && savedMessageIdsRef.current.has(message.id)) {
        return;
      }

      const supabase = createBrowserClient();

      const insertData = {
        session_id: sessionId,
        role: message.role,
        content: message.content,
      };

      const { data } = await (
        supabase.from(
          "ai_interview_messages"
        ) as ReturnType<typeof supabase.from>
      )
        .insert(insertData as never)
        .select()
        .single();

      if (data && typeof data === "object" && "id" in data) {
        savedMessageIdsRef.current.add(data.id as string);
      }
    },
    [sessionId]
  );

  // Create transport with sessionId in body
  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: { sessionId },
  });

  const chat = useChat({
    transport,
    onFinish: async (message) => {
      // Save AI message to DB after streaming completes
      const text = getMessageText(message.message);
      await saveMessageToDB({
        role: "assistant",
        content: text,
        id: message.message.id,
      });

      // Also save any pending user message
      if (pendingUserMessageRef.current) {
        await saveMessageToDB({
          role: "user",
          content: pendingUserMessageRef.current,
        });
        pendingUserMessageRef.current = null;
      }
    },
  });

  // Load existing messages from DB
  useEffect(() => {
    if (initialLoadDoneRef.current) return;

    async function loadMessages() {
      const supabase = createBrowserClient();

      const { data: existingMessages } = await (
        supabase.from(
          "ai_interview_messages"
        ) as ReturnType<typeof supabase.from>
      )
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      const messages = existingMessages as DBMessage[] | null;

      if (messages && messages.length > 0) {
        const formattedMessages = messages.map(createUIMessage);
        // Track already-saved message IDs
        messages.forEach((m) => savedMessageIdsRef.current.add(m.id));
        // Set messages in chat using setMessages
        chat.setMessages(formattedMessages);
      }

      setIsLoadingHistory(false);
      initialLoadDoneRef.current = true;
      onMessagesLoaded?.();
    }

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();

      const userInput = input.trim();
      if (!userInput) return;

      // Store for saving after onFinish
      pendingUserMessageRef.current = userInput;

      // Save user message immediately
      await saveMessageToDB({
        role: "user",
        content: userInput,
      });

      // Clear input
      setInput("");

      // Send message to API
      chat.sendMessage({ text: userInput });
    },
    [input, chat, saveMessageToDB]
  );

  // Send message programmatically (for initial greeting trigger)
  const sendMessage = useCallback(
    async (message: { text: string }) => {
      // Store for saving after onFinish
      pendingUserMessageRef.current = message.text;

      // Save user message immediately
      await saveMessageToDB({
        role: "user",
        content: message.text,
      });

      // Send message to API
      chat.sendMessage(message);
    },
    [chat, saveMessageToDB]
  );

  return {
    messages: chat.messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chat.status === "streaming" || chat.status === "submitted",
    isLoadingHistory,
    sendMessage,
    setMessages: chat.setMessages,
    error: chat.error,
    status: chat.status,
  };
}
