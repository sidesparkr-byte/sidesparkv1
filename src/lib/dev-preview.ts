function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === "development";
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
