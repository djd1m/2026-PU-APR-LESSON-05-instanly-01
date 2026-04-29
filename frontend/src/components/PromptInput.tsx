"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface PromptInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
}

export function PromptInput({ placeholder = "Describe what you want to generate...", onSubmit }: PromptInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  }

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-blue-600 to-violet-600">
      <div className="flex items-center rounded-2xl bg-bg-secondary">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          rows={3}
          className="flex-1 resize-none rounded-2xl bg-transparent px-5 py-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
