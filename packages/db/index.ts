import { createKysely } from "@vercel/postgres-kysely";

import type { DB } from "./prisma/types";

export { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

export * from "./prisma/types";
export * from "./prisma/enums";

// Skip database initialization during CI builds
export const db = process.env.CI
  ? ({} as ReturnType<typeof createKysely<DB>>)
  : createKysely<DB>();
