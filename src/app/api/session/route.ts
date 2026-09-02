import { VERDICTS } from "@/lib/verdicts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shakes, damage, finalMood } = body;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return Response.json({ ok: true, offline: true });
    }

    try {
      const verdict_ids = VERDICTS.slice(0, Math.floor(shakes)).map((_, i) => i + 1);
      await fetch(`${url}/rest/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        body: JSON.stringify({
          total_shakes: shakes,
          total_damage: damage,
          final_mood: finalMood,
          verdict_ids,
        }),
      });
    } catch (e) {
      console.error("Failed to persist session:", e);
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("API error:", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
