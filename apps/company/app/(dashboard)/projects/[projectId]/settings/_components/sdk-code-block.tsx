"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { Copy, Check } from "lucide-react";

interface SdkCodeBlockProps {
  code: string;
  language?: string;
}

export function SdkCodeBlock({ code, language = "html" }: SdkCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 bg-background/80 backdrop-blur-sm"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 overflow-x-auto text-sm leading-relaxed">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  );
}
