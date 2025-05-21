"use client";
import { useState } from "react";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
};

type LoginFormProps = {
  onLogin: (employee: Employee, sessionId: string) => void;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      onLogin(data.employee, data.sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md rounded-lg bg-[#005792] p-8 shadow-xl border border-[#2A3042]/50">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Employee Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#2A3042] bg-[#1A1F2E] px-3 py-2 text-white placeholder-gray-400 focus:border-[#8BC34A] focus:outline-none focus:ring-1 focus:ring-[#8BC34A]"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-[#8BC34A] to-[#43a047] hover:from-[#7CB342] hover:to-[#388E3C] px-4 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-50 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}