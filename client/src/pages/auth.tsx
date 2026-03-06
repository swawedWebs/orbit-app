import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const res = await apiRequest("POST", endpoint, { email, password });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (err: Error) => {
      const msg = err.message;
      try {
        const parsed = JSON.parse(msg.split(": ").slice(1).join(": "));
        setError(parsed.message || "Something went wrong");
      } catch {
        setError(msg || "Something went wrong");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#0b0f1a" }}>
      <div className="stars-layer" />
      <div className="stars-layer-2" />
      <div
        className="w-full max-w-sm rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 mx-3 sm:mx-0 text-center relative z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        <h2
          className="text-4xl font-bold text-white mb-2"
          data-testid="text-auth-title"
        >
          Orbit
        </h2>
        <p className="text-white/40 text-sm mb-8">Your life as a solar system</p>

        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm text-red-300"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            data-testid="text-auth-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-testid="input-email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-testid="input-password"
          />

          <button
            type="submit"
            disabled={mutation.isPending}
            className="orbit-btn w-full text-center justify-center flex items-center"
            data-testid="button-auth-submit"
          >
            {mutation.isPending
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          className="mt-6 text-sm text-white/40 hover:text-white/60 transition-colors bg-transparent shadow-none"
          style={{ boxShadow: "none", background: "transparent", padding: "8px" }}
          data-testid="button-toggle-auth"
        >
          {isLogin ? "Don't have an account? Create one" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
