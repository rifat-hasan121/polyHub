"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to create your account.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Your account was created, but automatic sign in failed. Please sign in.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Create your PolyHub account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Register with your name, email, and a password.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="name">
            Name
            <input
              autoComplete="name"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
              id="name"
              maxLength={100}
              name="name"
              required
              type="text"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
              id="email"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Password
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Use at least 8 characters; passwords are limited to 72 bytes.
            </span>
          </label>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-cyan-700 hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
