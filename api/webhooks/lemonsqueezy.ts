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

// Disable body parsing so we can read the raw bytes for HMAC verification.
// LemonSqueezy signs the exact raw request body — JSON.stringify(req.body)
// is unreliable because key ordering or whitespace may differ.
export const config = {
  api: {
    bodyParser: false,
  },
};

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function verifySignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("[lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return false;
  }
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
  console.log(`[lemonsqueezy] x-signature=${signature ? "present" : "MISSING"}, x-event-name=${req.headers["x-event-name"] ?? "MISSING"}`);

  if (!signature) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const rawBody = await readRawBody(req);
  const valid = verifySignature(rawBody, signature);
  console.log(`[lemonsqueezy] secret_set=${!!WEBHOOK_SECRET}, body_length=${rawBody.length}, valid=${valid}`);

  if (!valid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.headers["x-event-name"] as string | undefined;
  const payload = JSON.parse(rawBody);

  switch (event) {
    case "order_created": {
      const order = payload?.data?.attributes;
      console.log(
        `[lemonsqueezy] New order — customer: ${order?.user_email}, ` +
        `product: ${order?.first_order_item?.product_name}, ` +
        `total: ${order?.total_formatted}`
      );
      break;
    }
    default:
      console.log(`[lemonsqueezy] Unhandled event: ${event}`);
  }

  return res.status(200).json({ received: true });
}
