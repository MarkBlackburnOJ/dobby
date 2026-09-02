import { VERDICTS } from "@/lib/verdicts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");

  if (source === "supabase") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return Response.json({ verdicts: VERDICTS });
    }

    try {
      const res = await fetch(`${url}/rest/v1/verdicts`, {
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
      });
      if (res.ok) {
        const verdicts = await res.json();
        return Response.json({ verdicts });
      }
    } catch {
      /* fallthrough to local */
    }
  }

  return Response.json({ verdicts: VERDICTS });
}
