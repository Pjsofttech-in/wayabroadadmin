import client, { unwrap } from "./paidPlanClient";

// POST /renewClientLayerSubscription -> AbroadUser (with subscription histories)
export const recordSubscription = async (payload) =>
  unwrap(await client.post("/renewClientLayerSubscription", payload));
