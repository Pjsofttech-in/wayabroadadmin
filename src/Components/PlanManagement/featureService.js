import client, { unwrap } from "./paidPlanClient";

// ---- Additional Feature master (§3.5) ----
export const getAllFeatures = async () => unwrap(await client.get("/getAllLayerAddFeature"));
export const getFeatureById = async (id) => unwrap(await client.get(`/getLayerAddFeature/${id}`));
export const createFeature = async (name) => unwrap(await client.post("/additionalLayerFeature", { name }));
export const updateFeature = async (id, name) => unwrap(await client.put(`/updateLayerAddFeature/${id}`, { name }));
export const deleteFeature = async (id) => unwrap(await client.delete(`/deleteLayerAddFeature/${id}`));

// ---- Feature assignment to plans (§3.6, PlanAdditionalFeatureController) ----
export const getFeaturesByPlanId = async (planId) =>
  unwrap(await client.get(`/getAdditionalFeatureByPlanId/${planId}`));

// featureEnableMap: { "<featureId>": true|false }
export const assignFeaturesToPlan = async (planId, featureEnableMap) =>
  unwrap(await client.post("/assignAdditionalFeatureToPlan", { planId, featureEnableMap }));

export const toggleFeatureValue = async (id, { planId, featureId, enabled }) =>
  unwrap(await client.put(`/updateAdditionalFeatureValue/${id}`, null, { params: { planId, featureId, enabled } }));

export const removeFeatureFromPlan = async (id) =>
  unwrap(await client.delete(`/deleteAdditionalFeatureValue/${id}`));
