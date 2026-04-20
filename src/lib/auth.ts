import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const PASSWORD_RESET_URL = "https://sidesparkv1bu.vercel.app/reset-password";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isButlerEmail(email: string) {
  return normalizeEmail(email).endsWith("@butler.edu");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function isExistingUserError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already registered")
  );
}

function isInvalidCredentialsError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("incorrect email or password")
  );
}

function isEmailNotConfirmedError(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  const normalizedEmail = normalizeEmail(email);

  if (!isButlerEmail(normalizedEmail)) {
    return { error: "Must use a Butler University email (@butler.edu)" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: metadata ?? {}
      }
    });

    if (error) {
      if (isExistingUserError(error.message)) {
        return { error: "An account with this email already exists" };
      }

      return { error: error.message };
    }

    const userAlreadyExists =
      data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;

    if (userAlreadyExists) {
      return { error: "An account with this email already exists" };
    }

    return { data, error: null };
  } catch (error) {
    return { error: getErrorMessage(error, "Unable to create account.") };
  }
}

export async function signIn(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isButlerEmail(normalizedEmail)) {
    return { error: "Must use a Butler University email (@butler.edu)" };
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      if (isInvalidCredentialsError(error.message)) {
        return { error: "Incorrect email or password" };
      }

      if (isEmailNotConfirmedError(error.message)) {
        return { error: "This account cannot sign in yet. Try creating your account again." };
      }

      return { error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { error: getErrorMessage(error, "Unable to sign in.") };
  }
}

export async function signOut() {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: getErrorMessage(error, "Unable to sign out.") };
  }
}

export async function sendPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isButlerEmail(normalizedEmail)) {
    return { error: "Must use a Butler University email (@butler.edu)" };
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: PASSWORD_RESET_URL
    });

    if (error) {
      return { error: error.message };
    }

    return {
      message: "If that email exists, a reset link was sent to your Butler inbox"
    };
  } catch {
    return {
      message: "If that email exists, a reset link was sent to your Butler inbox"
    };
  }
}

export async function updatePassword(newPassword: string) {
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: getErrorMessage(error, "Unable to update password.") };
  }
}

export async function getSession() {
  try {
    const supabase = createSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session ?? null;
  } catch {
    return null;
  }
}
