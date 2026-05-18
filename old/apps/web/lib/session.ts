import { headers } from "next/headers";

import { auth } from "./auth";

export async function getServerSession() {
  if (!auth) return null;
  return auth.api.getSession({ headers: await headers() });
}
