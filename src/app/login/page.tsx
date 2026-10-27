"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCredentialsSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setError("Unable to sign in with those credentials.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Sign in to PolyHub</h1>
        <p className="mt-2 text-sm text-slate-300">
          Continue with Google or use your registered email and password.
        </p>
        <button
          className="mt-6 w-full rounded-lg border border-white/15 px-4 py-3 font-medium transition hover:bg-white/10"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          type="button"
        >
          Continue with Google
        </button>
        <div className="my-6 border-t border-white/10" />
        <form className="space-y-4" onSubmit={handleCredentialsSignIn}>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
              id="email"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400"
              id="password"
              name="password"
              required
              type="password"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-300">
          New to PolyHub?{" "}
          <Link className="font-medium text-cyan-300 hover:underline" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
