"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signUpAction, type AuthState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MacWindow } from "@/components/mac-window"

export default function SignUpPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    signUpAction,
    null
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <MacWindow className="w-full max-w-sm receipt-slip">
        <div className="flex flex-col gap-6 p-6">
          <div className="text-center">
            <h1 className="text-base font-semibold tracking-widest uppercase text-[var(--receipt-ink)]">
              Sign up
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Settle Up – Expense Splitting
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            {state?.error && (
              <p
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {state.error}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="mt-2">
              Sign up
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </MacWindow>
    </div>
  )
}
