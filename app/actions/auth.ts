"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AuthState = { error?: string } | null

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string
  const name = (formData.get("name") as string)?.trim()

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { name } } : undefined,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
