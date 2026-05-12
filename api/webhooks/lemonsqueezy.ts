import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";

/* ─────────────────────────────────────────────────────────────
   Buestro — LemonSqueezy webhook handler
   Endpoint: POST /api/webhooks/lemonsqueezy

   Events handled:
     order_created  → log purchase (Pro delivery via LS email)

   Required env vars (set in Vercel dashboard):
     LEMONSQUEEZY_WEBHOOK_SECRET  — from LS Settings → Webhooks
   ───────────────────────────────────────────────────────────── */

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

function verifySignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["x-signature"] as string | undefined;
  if (!signature) {
    return res.status(401).json({ error: "Missing signature" });
  }

  // Vercel gives us the raw body as a Buffer when bodyParser is disabled
  const rawBody =
    typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body);

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.headers["x-event-name"] as string | undefined;
  const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  console.log(`[lemonsqueezy] event=${event}`, JSON.stringify(payload, null, 2));

  switch (event) {
    case "order_created": {
      const order = payload?.data?.attributes;
      console.log(
        `[lemonsqueezy] New order — customer: ${order?.user_email}, ` +
        `product: ${order?.first_order_item?.product_name}, ` +
        `total: ${order?.total_formatted}`
      );
      // Future: invite buyer to buestro/card-pro GitHub repo
      break;
    }
    default:
      console.log(`[lemonsqueezy] Unhandled event: ${event}`);
  }

  return res.status(200).json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
