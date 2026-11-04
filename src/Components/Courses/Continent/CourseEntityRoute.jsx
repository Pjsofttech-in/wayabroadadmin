import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { getAllContinents } from "./ContinentService";
import { getAllCountries } from "./CountryService";
import StateService from "./StateService";
import CityService from "./CityService";
import { getAllUniversity } from "./UniversityService";
import { getAllColleges } from "./CollegeService";
import { getCourseBreadcrumbEntity } from "./CourseBreadcrumbService";
import CourseBreadcrumb from "./CourseBreadcrumb";
import Country from "./Country";
import State from "./State";
import City from "./City";
import University from "./University";
import College from "./College";
import Course from "./Course";

const auth = () => ({
  role: sessionStorage.getItem("role") || "",
  email: sessionStorage.getItem("email") || "",
  branchCode: sessionStorage.getItem("branchCode") || "",
});

const COURSE_HIERARCHY = [
  { type: "continent", param: "continentId", name: "Continent", route: "continent" },
  { type: "country", param: "countryId", name: "Country", route: "country" },
  { type: "state", param: "stateId", name: "State", route: "state" },
  { type: "city", param: "cityId", name: "City", route: "city" },
  { type: "university", param: "universityId", name: "University", route: "university" },
  { type: "college", param: "collegeId", name: "College", route: "college" },
  { type: "course", param: "courseId", name: "Course", route: "course" },
];

const LABEL_FIELDS = {
  continent: ["continentname", "continentName", "name"],
  country: ["country", "countryName", "name"],
  state: ["state", "stateName", "name"],
  city: ["city", "cityName", "name"],
  university: ["universityName", "university", "name"],
  college: ["collegeName", "college", "name"],
};

const TARGET_CONTEXT_PARAMS = {
  continent: [],
  country: ["continentId"],
  state: ["continentId", "countryId"],
  city: ["continentId", "countryId", "stateId"],
  university: ["continentId", "countryId", "stateId", "cityId"],
  college: ["continentId", "countryId", "stateId", "cityId", "universityId"],
  course: ["continentId", "countryId", "stateId", "cityId", "universityId", "collegeId"],
};

const entityConfigs = {
  country: {
    title: "Country Management",
    param: "continentId",
    label: "Continent",
    load: ({ role, email }) => getAllContinents(role, email),
    display: (item) => item.continentname || item.continentName || item.name || `Continent ${item.id}`,
    render: (parent, back) => <Country continent={parent} onBack={back} />,
  },
  state: {
    title: "State Management",
    param: "countryId",
    label: "Country",
    load: ({ role, email }) => getAllCountries({ role, email }),
    display: (item) => item.country || item.countryName || item.name || `Country ${item.id}`,
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
  course: {
    title: "Course Management",
    param: "collegeId",
    label: "College",
    load: ({ role, email, branchCode }) => getAllColleges({ role, email, branchCode }),
    display: (item) => item.collegeName || item.college || item.name || `College ${item.id}`,
    render: (parent, back, a) => (
      <Course
        collegeId={parent?.id}
        role={a.role}
        email={a.email}
        branchCode={a.branchCode}
        onBack={back}
      />
    ),
  },
};

function getId(item) {
  return item?.id == null ? "" : String(item.id);
}

function getEntityLabel(type, record, id) {
  const fields = LABEL_FIELDS[type] || [];
  const label = fields.map((field) => record?.[field]).find((value) => String(value ?? "").trim());
  return label ? String(label).trim() : `${COURSE_HIERARCHY.find((item) => item.type === type)?.name || "Entity"} #${id}`;
}

function parseHierarchyIds(paramsKey) {
  const params = new URLSearchParams(paramsKey);
  return Object.fromEntries(COURSE_HIERARCHY.map(({ type, param }) => [type, params.get(param) || ""]));
}

function makeBreadcrumbHref(type, ids) {
  // Always keep ancestor breadcrumbs navigable. Preserve every known ancestor
  // ID, but do not disable the link just because some context is unavailable;
  // the destination page can still open and let the user select its parent.
  const requiredParams = TARGET_CONTEXT_PARAMS[type] || [];
  const params = new URLSearchParams();

  for (const param of requiredParams) {
    const paramToType = COURSE_HIERARCHY.find((item) => item.param === param)?.type;
    const value = paramToType ? ids[paramToType] : "";
    if (value) params.set(param, value);
  }

  const query = params.toString();
  return `/wayabroadadmin/admin/courses/${type}${query ? `?${query}` : ""}`;
}

export default function CourseEntityRoute({ entity }) {
  const config = entityConfigs[entity] || entityConfigs.country;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(searchParams.get(config.param) || "");
  const [breadcrumbRecords, setBreadcrumbRecords] = useState({});
  const credentials = useMemo(auth, []);
  const paramsKey = searchParams.toString();
  const routeIds = useMemo(() => parseHierarchyIds(paramsKey), [paramsKey]);

  useEffect(() => {
    setSelectedId(searchParams.get(config.param) || "");
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


  const selectedParent = options.find((item) => getId(item) === selectedId) || null;

  useEffect(() => {
    if (loading) return undefined;

    let active = true;
    const entityIndex = COURSE_HIERARCHY.findIndex((item) => item.type === entity);
    const ancestorTypes = entityIndex < 0 ? [] : COURSE_HIERARCHY.slice(0, entityIndex).map((item) => item.type).filter((type) => routeIds[type]);
    const immediateParentType = entityIndex > 0 ? COURSE_HIERARCHY[entityIndex - 1].type : null;
    const knownRecords = {};

    // Reuse the selected parent already loaded by this route.
    if (immediateParentType && selectedParent && getId(selectedParent) === routeIds[immediateParentType]) {
      knownRecords[immediateParentType] = selectedParent;
    }

    setBreadcrumbRecords(knownRecords);

    const missingTypes = ancestorTypes.filter((type) => {
      const existing = knownRecords[type];
      return !existing || getId(existing) !== routeIds[type];
    });

    Promise.all(missingTypes.map(async (type) => {
      try {
        const record = await getCourseBreadcrumbEntity(type, routeIds[type], credentials);
        return [type, record];
      } catch {
        // Breadcrumb resolution must not block the page's normal functionality.
        return [type, null];
      }
    })).then((entries) => {
      if (!active) return;
      const resolved = { ...knownRecords };
      entries.forEach(([type, record]) => {
        if (record) resolved[type] = record;
      });
      setBreadcrumbRecords(resolved);
    });

    return () => { active = false; };
  }, [entity, paramsKey, loading, selectedParent, credentials, routeIds]);

  const breadcrumbItems = useMemo(() => {
    const entityIndex = COURSE_HIERARCHY.findIndex((item) => item.type === entity);
    if (entityIndex <= 0) return [];

    return COURSE_HIERARCHY.slice(0, entityIndex)
      .filter(({ type }) => Boolean(routeIds[type]))
      .map(({ type, param }) => ({
        type,
        id: routeIds[type],
        label: getEntityLabel(type, breadcrumbRecords[type], routeIds[type]),
        to: makeBreadcrumbHref(type, routeIds),
        param,
      }));
  }, [entity, routeIds, breadcrumbRecords]);

  // Keep the URL hierarchy consistent when a parent changes. A descendant ID
  // belongs to the old branch and must not survive a parent switch.
  const updateParamAndClearDescendants = (name, value) => {
    const next = new URLSearchParams(searchParams);
    const selectedIndex = COURSE_HIERARCHY.findIndex((item) => item.param === name);

    if (value) next.set(name, value);
    else next.delete(name);

    if (selectedIndex >= 0) {
      COURSE_HIERARCHY.slice(selectedIndex + 1).forEach(({ param }) => {
        next.delete(param);
      });
    }

    setSearchParams(next, { replace: true });
  };

  const handleParentChange = (value) => {
    setSelectedId(value);
    updateParamAndClearDescendants(config.param, value);
  };


  // Return to the parent entity screen, retaining all known ancestors including
  // college context when returning from Course Management to Stream Management.
  const goBack = () => {
    const routeByEntity = {
      country: "continent",
      state: "country",
      city: "state",
      university: "city",
      college: "university",
      course: "college",
    };

    const ancestorsByEntity = {
      country: [],
      state: ["continentId"],
      city: ["continentId", "countryId"],
      university: ["continentId", "countryId", "stateId"],
      college: ["continentId", "countryId", "stateId", "cityId"],
      course: ["continentId", "countryId", "stateId", "cityId", "universityId"],
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
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 1.5, md: 3 }}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {config.title}
          </Typography>
          <Box sx={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
            <CourseBreadcrumb items={breadcrumbItems} currentLabel="" />
          </Box>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ width: { xs: "100%", md: 440 }, maxWidth: "100%", flexShrink: 0 }}
        >
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
        </Stack>
      </Stack>
      {loading && <CircularProgress size={24} />}
      {!!loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {!loading && !loadError && !selectedParent && <Alert severity="info">Select a {config.label.replace(" (required by API)", "")} above to load this page. You can also provide its ID in the URL query string, for example <strong>?{config.param}=123</strong>.</Alert>}
      {!loading && !loadError && selectedParent && config.render(selectedParent, goBack, credentials, selectedParent?.id)}
    </Box>
  );
}


/** Redirect legacy Stream hierarchy URLs directly to the selected College's Course page. */
export function LegacyStreamRedirect() {
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  params.delete("streamId");
  const query = params.toString();

  return (
    <Navigate
      to={`/wayabroadadmin/admin/courses/course${query ? `?${query}` : ""}`}
      replace
    />
  );
}
