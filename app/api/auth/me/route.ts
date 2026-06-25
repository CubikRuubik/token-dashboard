import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/api";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return Response.json({ address: null });

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return Response.json({ address: null });
    }
    return Response.json({ address: payload.sub ?? null });
  } catch {
    return Response.json({ address: null });
  }
}
