import axiosInstance from "../../Common/axiosConfig";

// These by-ID routes already exist in the supplied backend. This service only
// reads entity labels for breadcrumbs; it does not change CRUD/API contracts.
const ENTITY_ENDPOINTS = {
  continent: "getContinentById",
  country: "getCountryById",
  state: "getStateById",
  city: "getCityById",
  university: "getUniversityById",
  college: "getCollegeById",
  stream: "getStreamById",
};

export async function getCourseBreadcrumbEntity(type, id, credentials = {}) {
  const endpoint = ENTITY_ENDPOINTS[type];
  if (!endpoint || id === undefined || id === null || id === "") {
    return null;
  }

  const response = await axiosInstance.get(
    `/${endpoint}/${encodeURIComponent(String(id))}`,
    {
      // Controllers that do not use these query parameters ignore them; they
      // are retained for consistency with the existing service conventions.
      params: {
        role: credentials.role || "",
        email: credentials.email || "",
      },
    }
  );

  return response.data ?? null;
}
