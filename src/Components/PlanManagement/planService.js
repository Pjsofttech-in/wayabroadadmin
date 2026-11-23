import client, { authParams, unwrap } from "./paidPlanClient";

export const getAllPlans = async () =>
  unwrap(await client.get("/getAllAbroadPlans", { params: authParams() }));

export const getPlanById = async (id) =>
  unwrap(await client.get(`/getAbroadPlan/${id}`, { params: authParams() }));

export const createPlan = async (payload) =>
  unwrap(await client.post("/createAbroadPlan", payload, { params: authParams() }));

export const updatePlan = async (id, payload) =>
  unwrap(await client.put(`/updateAbroadPlan/${id}`, payload, { params: authParams() }));

export const deletePlan = async (id) =>
  unwrap(await client.delete(`/deleteAbroadPlan/${id}`, { params: authParams() }));
