"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const emailRedirectMap: Record<string, string> = {
  "shreya.naravane@marico.com": "/capex",
  "manager@marico.com": "/manager",
  "cio@marico.com": "/cio",
  "cfo@marico.com": "/cfo",
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailLower = email.toLowerCase();
    if (!Object.keys(emailRedirectMap).includes(emailLower)) {
      setError("Only authorized emails are allowed to login.");
      setIsLoading(false);
      return;
    }

    // Hardcoded login: just redirect, no backend call
    router.push(emailRedirectMap[emailLower]);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-4xl rounded-3xl bg-[#005792] p-20 shadow-2xl border-4 border-[#2A3042]/50 flex flex-col items-center">
        <Image src="/marico-icon.png" alt="Marico Logo" width={120} height={120} className="mb-8" priority />
        <h1 className="mb-12 text-center text-5xl font-extrabold text-white">Employee Login</h1>
        <form onSubmit={handleSubmit} className="space-y-12 w-full max-w-2xl">
          <div>
            <label htmlFor="email" className="block text-4xl font-bold text-white mb-6">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-2xl border-4 border-[#2A3042] bg-[#1A1F2E] px-16 py-10 text-4xl text-white placeholder-gray-400 focus:border-[#8BC34A] focus:outline-none focus:ring-4 focus:ring-[#8BC34A]"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-2xl text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-[#8BC34A] to-[#43a047] hover:from-[#7CB342] hover:to-[#388E3C] px-10 py-6 text-3xl font-extrabold text-white focus:outline-none focus:ring-4 focus:ring-[#8BC34A] focus:ring-opacity-50 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="flex flex-col items-center w-full max-w-2xl mt-10">
          <div className="flex items-center w-full mb-6">
            <div className="flex-1 h-1 bg-gray-300" />
            <span className="mx-6 text-2xl font-bold text-white">OR</span>
            <div className="flex-1 h-1 bg-gray-300" />
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-[#1976d2] hover:bg-[#1565c0] px-10 py-6 text-3xl font-extrabold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-[#1976d2] focus:ring-opacity-50"
            onClick={() => alert('SSO Login not implemented')}
          >
            SSO
          </button>
        </div>
      </div>
    </div>
  );
}