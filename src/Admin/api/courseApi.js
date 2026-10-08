import axiosInstance from "../../Components/Common/axiosConfig";

// ----------- SEARCH APIS -----------

export const searchUniversities = async (name) => {
  const res = await axiosInstance.get("/searchUniversities", {
    params: { name },
  });
  return res.data;
};

export const searchStates = async (name) => {
  const res = await axiosInstance.get("/searchStates", {
    params: { name },
  });
  return res.data;
};

export const searchCities = async (name) => {
  const res = await axiosInstance.get("/searchCities", {
    params: { name },
  });
  return res.data;
};

export const searchColleges = async (name) => {
  const res = await axiosInstance.get("/searchColleges", {
    params: { name },
  });
  return res.data;
};

export const searchCountries = async (name) => {
  const res = await axiosInstance.get("/searchCountries", {
    params: { name },
  });
  return res.data;
};

export const searchStreams = async (name) => {
  const res = await axiosInstance.get("/searchStreams", {
    params: { name },
  });
  return res.data;
};


// ----------- CONTINENT API -----------
// Kept for other pages that may still use this API.
// CourseFinder no longer uses it.

export const getAllContinents = async (search = "", email, role) => {
  const branchCode = sessionStorage.getItem("branchCode") || "";

  const params = {
    role,
    email,
    branchCode,
  };

  if (search) {
    params.search = search;
  }

  const res = await axiosInstance.get("/getAllContinents", {
    params,
  });

  return res.data;
};


// ----------- COUNTRY API -----------
// Continent filtering removed.

export const getAllCountries = async ({
  search = "",
  email,
  role,
  branchCode,
}) => {
  const params = {
    role,
    email,
    branchCode,
  };

  if (search) {
    params.search = search;
  }

  const res = await axiosInstance.get("/getAllCountries", {
    params,
  });

  return res.data;
};


// ----------- UNIVERSITY API -----------

export const getAllUniversities = async ({
  search = "",
  email,
  role,
  branchCode,
  countryId,
  cityId,
}) => {
  const params = {
    role,
    email,
    branchCode,
  };

  if (search) {
    params.search = search;
  }

  if (countryId) {
    params.countryId = countryId;
  }

  if (cityId) {
    params.cityId = cityId;
  }

  const res = await axiosInstance.get("/getAllUniversities", {
    params,
  });

  return res.data;
};


// ----------- STREAM API -----------

export const getAllStreams = async ({
  search = "",
  email,
  role,
  branchCode,
  universityId,
}) => {
  const params = {
    role,
    email,
  };

  if (branchCode) {
    params.branchCode = branchCode;
  }

  if (search) {
    params.search = search;
  }

  if (universityId) {
    params.universityId = universityId;
  }

  const res = await axiosInstance.get("/getAllStreams", {
    params,
  });

  return res.data;
};


// ----------- COURSE API -----------

export const getAllCourses = async () => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    const response = await axiosInstance.get("/getAllCourseName", {
      params: {
        role,
        email,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};


// ----------- FILTER COURSES API -----------

export const filterCourses = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") {
          params.append(key, v);
        }
      });
    } else if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params.append(key, value);
    }
  });

  try {
    const res = await axiosInstance.get("/filterCourses", {
      params,
      paramsSerializer: (params) => params.toString(),
    });

    return res.data;
  } catch (error) {
    console.error("Error in filterCourses:", error);
    throw error;
  }
};


// ----------- STATE API -----------

export const getAllStates = async ({
  email,
  role,
  countryId,
}) => {
  const params = {
    email,
    role,
  };

  if (countryId) {
    params.countryId = countryId;
  }

  const res = await axiosInstance.get("/getAllStates", {
    params,
  });

  return res.data;
};


// ----------- CITY API -----------

export const getAllCities = async ({
  email,
  role,
  stateId,
}) => {
  const params = {
    email,
    role,
  };

  if (stateId) {
    params.stateId = stateId;
  }

  const res = await axiosInstance.get("/getAllCities", {
    params,
  });

  return res.data;
};


// ----------- COLLEGE API -----------

export const getAllColleges = async ({
  email,
  role,
  universityId,
}) => {
  const params = {
    email,
    role,
  };

  if (universityId) {
    params.universityId = universityId;
  }

  const res = await axiosInstance.get("/getAllColleges", {
    params,
  });

  return res.data;
};


// ----------- HIERARCHY API -----------

export const getHierarchy = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") {
          params.append(key, v);
        }
      });
    } else if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params.append(key, value);
    }
  });

  try {
    const res = await axiosInstance.get("/hierarchy", {
      params,
      paramsSerializer: (params) => params.toString(),
    });

    return res.data;
  } catch (error) {
    console.error("Error in getHierarchy:", error);
    throw error;
  }
};


// ----------- HIERARCHY HEALTH CHECK API -----------

export const getHierarchyHealthCheck = async () => {
  const res = await axiosInstance.get("/hierarchy/health");
  return res.data;
};