import { cookies } from "next/headers";

export async function sesiToken(): Promise<string | null> {
  return (await cookies()).get("tokowa_token")?.value ?? null;
}
