#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const DEFAULT_TEST_USERS = [
  {
    email: "test.buyer1@butler.edu",
    firstName: "Avery",
    lastInitial: "B",
    graduationYear: 2027,
    major: "Finance",
    bio: "Test buyer account for local QA."
  },
  {
    email: "test.buyer2@butler.edu",
    firstName: "Jordan",
    lastInitial: "P",
    graduationYear: 2026,
    major: "Marketing",
    bio: "Second buyer test account."
  },
  {
    email: "test.seller1@butler.edu",
    firstName: "Felipe",
    lastInitial: "R",
    graduationYear: 2026,
    major: "Computer Science",
    bio: "Primary seller test account."
  },
  {
    email: "test.seller2@butler.edu",
    firstName: "Cam",
    lastInitial: "D",
    graduationYear: 2028,
    major: "Engineering",
    bio: "Backup seller test account."
  },
  {
    email: "test.tutor@butler.edu",
    firstName: "Mina",
    lastInitial: "L",
    graduationYear: 2025,
    major: "Economics",
    bio: "Tutoring-focused test profile."
  },
  {
    email: "test.service@butler.edu",
    firstName: "Sam",
    lastInitial: "R",
    graduationYear: 2029,
    major: "Design",
    bio: "Service listing test profile."
  }
];

const SAMPLE_LISTINGS = [
  {
    title: "Dorm Mini Fridge",
    type: "item",
    category: "Furniture",
    condition: "good",
    price: 65,
    description: "Sample listing seeded for local QA."
  },
  {
    title: "Dorm Cleaning Session",
    type: "service",
    category: "Cleaning",
    condition: null,
    price: 40,
    description: "Sample service listing seeded for local QA."
  },
  {
    title: "ECON 101 Tutoring",
    type: "tutoring",
    category: "Tutoring",
    condition: null,
    price: 25,
    description: "Sample tutoring listing seeded for local QA."
  },
  {
    title: "Spring Housing Sublet",
    type: "housing_sublet",
    category: "Housing",
    condition: null,
    price: 780,
    description: "Sample student sublet listing seeded for local QA.",
    availability: {
      room_type: "Single",
      roommates: 2,
      term_start: "2026-08-15",
      term_end: "2026-12-20",
      distance: "On campus"
    }
  }
];

function parseArgs(argv) {
  const args = {
    withListings: false,
    dryRun: false,
    count: null,
    emails: null
  };

  for (const raw of argv) {
    if (raw === "--with-listings") args.withListings = true;
    else if (raw === "--dry-run") args.dryRun = true;
    else if (raw.startsWith("--count=")) {
      const parsed = Number(raw.slice("--count=".length));
      if (Number.isFinite(parsed) && parsed > 0) {
        args.count = Math.floor(parsed);
      }
    } else if (raw.startsWith("--emails=")) {
      const values = raw
        .slice("--emails=".length)
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      args.emails = values.length > 0 ? values : null;
    }
  }

  return args;
}

function loadEnvFromDotenvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf8");
  const out = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equals = line.indexOf("=");
    if (equals <= 0) continue;

    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function getEnv(key, fallback = "") {
  return process.env[key] || fallback;
}

function resolveEnv() {
  const dotenvValues = loadEnvFromDotenvFile(path.join(PROJECT_ROOT, ".env.local"));

  const supabaseUrl =
    getEnv("NEXT_PUBLIC_SUPABASE_URL", dotenvValues.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey =
    getEnv("SUPABASE_SERVICE_ROLE_KEY", dotenvValues.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

function toProfilePayload(user, seedUser) {
  return {
    id: user.id,
    email: seedUser.email,
    first_name: seedUser.firstName,
    last_initial: seedUser.lastInitial,
    graduation_year: seedUser.graduationYear,
    major: seedUser.major,
    bio: seedUser.bio,
    updated_at: new Date().toISOString()
  };
}

async function findUserByEmail(adminClient, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find(
      (user) => (user.email || "").toLowerCase() === email.toLowerCase()
    );
    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function createOrUpdateUser(adminClient, seedUser, dryRun) {
  const existing = await findUserByEmail(adminClient, seedUser.email);

  if (existing) {
    if (!dryRun) {
      const { error } = await adminClient.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        user_metadata: {
          first_name: seedUser.firstName,
          last_initial: seedUser.lastInitial
        }
      });
      if (error) throw error;
    }
    return { user: existing, created: false };
  }

  if (dryRun) {
    return {
      user: {
        id: `dry-run-${seedUser.email}`,
        email: seedUser.email
      },
      created: true
    };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: seedUser.email,
    email_confirm: true,
    user_metadata: {
      first_name: seedUser.firstName,
      last_initial: seedUser.lastInitial
    }
  });

  if (error || !data?.user) {
    throw error || new Error(`Unable to create user for ${seedUser.email}`);
  }

  return { user: data.user, created: true };
}

async function upsertProfile(adminClient, user, seedUser, dryRun) {
  if (dryRun) return;
  const payload = toProfilePayload(user, seedUser);
  const { error } = await adminClient.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

async function seedListingsForUsers(adminClient, usersByEmail, dryRun) {
  const targets = [
    usersByEmail.get("test.seller1@butler.edu"),
    usersByEmail.get("test.service@butler.edu"),
    usersByEmail.get("test.tutor@butler.edu"),
    usersByEmail.get("test.seller2@butler.edu")
  ].filter(Boolean);

  if (targets.length === 0) return { inserted: 0, skipped: 0 };

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const user = targets[i];
    const seed = SAMPLE_LISTINGS[i % SAMPLE_LISTINGS.length];
    const title = `${seed.title} (Seed)`;

    const { data: existing, error: existingError } = await adminClient
      .from("listings")
      .select("id")
      .eq("seller_id", user.id)
      .eq("title", title)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      inserted += 1;
      continue;
    }

    const payload = {
      seller_id: user.id,
      type: seed.type,
      title,
      description: seed.description,
      price: seed.price,
      category: seed.category,
      condition: seed.condition,
      photos: [],
      availability: seed.availability || null,
      status: "active"
    };

    const { error: insertError } = await adminClient.from("listings").insert(payload);
    if (insertError) throw insertError;
    inserted += 1;
  }

  return { inserted, skipped };
}

function selectUsers(args) {
  const source = [...DEFAULT_TEST_USERS];
  let filtered = source;

  if (args.emails) {
    const allow = new Set(args.emails);
    filtered = filtered.filter((u) => allow.has(u.email.toLowerCase()));
  }

  if (args.count) {
    filtered = filtered.slice(0, args.count);
  }

  return filtered;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { supabaseUrl, serviceRoleKey } = resolveEnv();

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const users = selectUsers(args);
  if (users.length === 0) {
    console.log("No users selected. Nothing to seed.");
    return;
  }

  console.log(
    `Seeding ${users.length} test users${args.withListings ? " + sample listings" : ""}${args.dryRun ? " [dry-run]" : ""}...`
  );

  const usersByEmail = new Map();
  let createdCount = 0;
  let updatedCount = 0;

  for (const seedUser of users) {
    const { user, created } = await createOrUpdateUser(adminClient, seedUser, args.dryRun);
    await upsertProfile(adminClient, user, seedUser, args.dryRun);
    usersByEmail.set(seedUser.email.toLowerCase(), user);
    if (created) createdCount += 1;
    else updatedCount += 1;
    console.log(`- ${seedUser.email} (${created ? "created" : "updated"})`);
  }

  let listingSummary = null;
  if (args.withListings) {
    listingSummary = await seedListingsForUsers(adminClient, usersByEmail, args.dryRun);
  }

  console.log("");
  console.log("Seed complete.");
  console.log(`Users created: ${createdCount}`);
  console.log(`Users updated: ${updatedCount}`);
  if (listingSummary) {
    console.log(`Listings inserted: ${listingSummary.inserted}`);
    console.log(`Listings skipped (already existed): ${listingSummary.skipped}`);
  }
}

main().catch((error) => {
  console.error("Seed failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
