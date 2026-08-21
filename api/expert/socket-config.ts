import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSocketUrl } from "../_lib/expertBackend";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ url: getSocketUrl() });
}
