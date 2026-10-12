import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllContinents } from "./ContinentService";
import { getAllCountries } from "./CountryService";
import StateService from "./StateService";
import CityService from "./CityService";
import { getAllUniversity } from "./UniversityService";
import { getAllColleges } from "./CollegeService";
import { getAllStreams } from "./StreamService";
import Country from "./Country";
import State from "./State";
import City from "./City";
import University from "./University";
import College from "./College";
import Stream from "./Stream";
import Course from "./Course";

const auth = () => ({
  role: sessionStorage.getItem("role") || "",
  email: sessionStorage.getItem("email") || "",
  branchCode: sessionStorage.getItem("branchCode") || "",
});

const entityConfigs = {
  country: {
    title: "Country Management",
    param: "continentId",
    label: "Continent",
    load: ({ role, email }) => getAllContinents(role, email),
    display: (item) => item.continentname || item.name || `Continent ${item.id}`,
    render: (parent, back) => <Country continent={parent} onBack={back} />,
  },
  state: {
    title: "State Management",
    param: "countryId",
    label: "Country",
    load: ({ role, email }) => getAllCountries({ role, email }),
    display: (item) => item.country || item.name || `Country ${item.id}`,
    render: (parent, back) => <State country={parent} onBack={back} />,
  },
  city: {
    title: "City Management",
    param: "stateId",
    label: "State",
    load: ({ role, email }) => StateService.getAllStates(role, email),
    display: (item) => item.state || item.name || item.stateName || `State ${item.id}`,
    render: (parent, back) => <City state={parent} onBack={back} />,
  },
  university: {
    title: "University Management",
    param: "cityId",
    label: "City (required by API)",
    load: ({ role, email, branchCode }) => CityService.getAllCities(role, email),
    display: (item) => item.city || item.name || item.cityName || `City ${item.id}`,
    render: (parent, back, a) => <University city={parent} role={a.role} email={a.email} branchCode={a.branchCode} onBack={back} />,
  },
  college: {
    title: "College Management",
    param: "universityId",
    label: "University",
    load: ({ role, email, branchCode }) => getAllUniversity({ role, email, branchCode }),
    display: (item) => item.universityName || item.university || item.name || `University ${item.id}`,
    render: (parent, back) => <College university={parent} onBack={back} />,
  },
  stream: {
    title: "Stream Management",
    param: "collegeId",
    label: "College context",
    load: ({ role, email, branchCode }) => getAllColleges({ role, email, branchCode }),
    display: (item) => item.collegeName || item.college || item.name || `College ${item.id}`,
    render: (parent, back, a) => <Stream college={parent} role={a.role} email={a.email} branchCode={a.branchCode} onBack={back} />,
  },
  course: {
    title: "Course Management",
    param: "streamId",
    label: "Stream",
    load: ({ role, email, branchCode }) => getAllStreams({ role, email, branchCode }),
    display: (item) => item.name || item.streamName || `Stream ${item.id}`,
    render: (parent, back, a, collegeId) => <Course stream={parent} collegeId={collegeId} role={a.role} email={a.email} branchCode={a.branchCode} onBack={back} />,
  },
};

function getId(item) {
  return item?.id == null ? "" : String(item.id);
}

export default function CourseEntityRoute({ entity }) {
  const config = entityConfigs[entity] || entityConfigs.country;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(searchParams.get(config.param) || "");
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(searchParams.get("collegeId") || "");
  const credentials = useMemo(auth, []);

  useEffect(() => {
    setSelectedId(searchParams.get(config.param) || "");
    if (entity === "course") setSelectedCollegeId(searchParams.get("collegeId") || "");
  }, [entity, config.param, searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    config.load(credentials)
      .then((data) => {
        if (active) setOptions(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (active) setLoadError(error?.response?.data?.message || error?.message || `Could not load ${config.label.toLowerCase()} options.`);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [entity, config, credentials]);

  useEffect(() => {
    if (entity !== "course") return undefined;
    let active = true;
    getAllColleges({ ...credentials })
      .then((data) => active && setCollegeOptions(Array.isArray(data) ? data : []))
      .catch(() => active && setCollegeOptions([]));
    return () => { active = false; };
  }, [entity, credentials]);

  const selectedParent = options.find((item) => getId(item) === selectedId) || null;
  const selectedCollege = collegeOptions.find((item) => getId(item) === selectedCollegeId) || null;

  const updateParam = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    setSearchParams(next, { replace: true });
  };

  const handleParentChange = (value) => {
    setSelectedId(value);
    updateParam(config.param, value);
  };

  const handleCollegeChange = (value) => {
    setSelectedCollegeId(value);
    updateParam("collegeId", value);
  };

  // Navigate to the parent entity's list while retaining only valid ancestor context.
  // Descendant IDs are deliberately removed so a previous selection cannot leak
  // into a different branch of the hierarchy.
  const goBack = () => {
    const routeByEntity = {
      country: "continent",
      state: "country",
      city: "state",
      university: "city",
      college: "university",
      stream: "college",
      course: "stream",
    };

    const ancestorsByEntity = {
      country: [],
      state: ["continentId"],
      city: ["continentId", "countryId"],
      university: ["continentId", "countryId", "stateId"],
      college: ["continentId", "countryId", "stateId", "cityId"],
      stream: ["continentId", "countryId", "stateId", "cityId", "universityId"],
      course: ["continentId", "countryId", "stateId", "cityId", "universityId", "collegeId"],
    };

    const parentRoute = routeByEntity[entity];
    if (!parentRoute) return;

    const params = new URLSearchParams();
    (ancestorsByEntity[entity] || []).forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    navigate(
      `/wayabroadadmin/admin/courses/${parentRoute}` +
      (params.toString() ? `?${params.toString()}` : "")
    );
  };

  if (!entityConfigs[entity]) return <Alert severity="error">Unknown course entity route.</Alert>;

  return (
    <Box sx={{ width: "100%", minWidth: 0, p: { xs: 1, sm: 2 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>{config.title}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, maxWidth: entity === "course" ? 900 : 460 }}>
        <FormControl fullWidth size="small" disabled={loading}>
          <InputLabel id={`${entity}-parent-label`}>{config.label}</InputLabel>
          <Select
            labelId={`${entity}-parent-label`}
            value={selectedId}
            label={config.label}
            onChange={(event) => handleParentChange(event.target.value)}
          >
            <MenuItem value=""><em>Select {config.label.replace(" (required by API)", "")}</em></MenuItem>
            {options.map((item) => <MenuItem key={getId(item)} value={getId(item)}>{config.display(item)}</MenuItem>)}
          </Select>
        </FormControl>
        {entity === "course" && (
          <FormControl fullWidth size="small" disabled={loading}>
            <InputLabel id="course-college-label">College (for create)</InputLabel>
            <Select labelId="course-college-label" value={selectedCollegeId} label="College (for create)" onChange={(event) => handleCollegeChange(event.target.value)}>
              <MenuItem value=""><em>Select College</em></MenuItem>
              {collegeOptions.map((item) => <MenuItem key={getId(item)} value={getId(item)}>{item.collegeName || item.college || item.name || `College ${item.id}`}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Stack>
      {loading && <CircularProgress size={24} />}
      {!!loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {!loading && !loadError && !selectedParent && <Alert severity="info">Select a {config.label.replace(" (required by API)", "")} above to load this page. You can also provide its ID in the URL query string, for example <strong>?{config.param}=123</strong>.</Alert>}
      {!loading && selectedParent && (entity !== "course" || selectedCollege) && config.render(selectedParent, goBack, credentials, selectedCollege?.id)}
      {entity === "course" && selectedParent && !selectedCollege && <Alert severity="info" sx={{ mt: 1 }}>Select the college as well. The backend create-course endpoint requires a collegeId.</Alert>}
    </Box>
  );
}
