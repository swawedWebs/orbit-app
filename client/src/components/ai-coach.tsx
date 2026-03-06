import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Send, Loader2 } from "lucide-react";

export function AICoach() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/coach", { prompt: text });
      return res.json();
    },
    onSuccess: (data) => {
      setResponse(data.reply);
    },
    onError: () => {
      setResponse("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim() || mutation.isPending) return;
    mutation.mutate(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="rounded-[20px] sm:rounded-[24px] p-4 sm:p-[25px] mt-6 sm:mt-10"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold text-white" data-testid="text-coach-heading">
          AI Life Coach
        </h2>
      </div>

      <div className="flex gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Orbit something...&#10;Example: I want to become an MRI technician"
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            minHeight: "70px",
          }}
          rows={2}
          data-testid="input-coach-prompt"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || mutation.isPending}
          className="orbit-btn self-end shrink-0 flex items-center justify-center disabled:opacity-40"
          style={{ padding: "12px 16px" }}
          data-testid="button-coach-submit"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {response && (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm text-white/85 leading-relaxed whitespace-pre-wrap"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
          data-testid="text-coach-response"
        >
          {response}
        </div>
      )}
    </div>
  );
}
