function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === "development";
}

function isValidEmail(email?: string | null) {
  if (typeof email !== "string") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // DEV ONLY — disabled in production
  if (isDevelopmentEnvironment()) {
    return (
      normalizedEmail.endsWith("@butler.edu") ||
      normalizedEmail.endsWith("@test.com")
    );
  }

  return normalizedEmail.endsWith("@butler.edu");
}

export function isDevPreviewEnabled() {
  // DEV ONLY — disabled in production
  if (!isDevelopmentEnvironment()) {
    return false;
  }
  const flag = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH ?? process.env.DEV_BYPASS_AUTH;
  return flag === "1" || flag === "true";
}

export function isDevAnyEmailDomainEnabled() {
  // DEV ONLY — disabled in production
  if (!isDevelopmentEnvironment()) {
    return false;
  }
  const flag =
    process.env.NEXT_PUBLIC_DEV_ALLOW_ANY_EMAIL_DOMAIN ??
    process.env.DEV_ALLOW_ANY_EMAIL_DOMAIN;
  return flag === "1" || flag === "true";
}

export function isDevQuickLoginEnabled() {
  // DEV ONLY — disabled in production
  if (!isDevelopmentEnvironment()) {
    return false;
  }
  const flag = process.env.NEXT_PUBLIC_DEV_QUICK_LOGIN ?? process.env.DEV_QUICK_LOGIN;
  return flag === "1" || flag === "true";
}

export function isDevSeedHelpersEnabled() {
  // DEV ONLY — disabled in production
  if (!isDevelopmentEnvironment()) {
    return false;
  }
  return true;
}

export function isAllowedAuthEmail(email?: string | null) {
  if (isValidEmail(email)) {
    return true;
  }

  // DEV ONLY — disabled in production
  if (!isDevelopmentEnvironment()) {
    return false;
  }

  return isDevAnyEmailDomainEnabled();
}
