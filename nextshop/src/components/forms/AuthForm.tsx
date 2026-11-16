"use client";

import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

type FieldErrors = Record<string, string[] | undefined>;

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        redirectTo?: string;
        error?: string;
        issues?: FieldErrors;
      };

      if (!response.ok || !result.redirectTo) {
        setError(result.error ?? "Unable to complete authentication.");
        setFieldErrors(result.issues ?? {});
        return;
      }

      const destination =
        mode === "login" && nextPath?.startsWith("/")
          ? nextPath
          : result.redirectTo;
      window.location.assign(destination);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex w-full max-w-md flex-col gap-5" onSubmit={handleSubmit}>
      {isRegister && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          {fieldErrors.name?.[0] && <span className="text-sm text-red-600">{fieldErrors.name[0]}</span>}
        </label>
      )}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        {fieldErrors.email?.[0] && <span className="text-sm text-red-600">{fieldErrors.email[0]}</span>}
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : 1}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        {fieldErrors.password?.[0] && <span className="text-sm text-red-600">{fieldErrors.password[0]}</span>}
      </label>
      {isRegister && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          {fieldErrors.confirmPassword?.[0] && (
            <span className="text-sm text-red-600">{fieldErrors.confirmPassword[0]}</span>
          )}
        </label>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
