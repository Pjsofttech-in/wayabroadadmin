import React, { useState, useEffect } from "react";
import { getStreamById } from "../../Settings/StreamService";
//import { message } from "antd";
import {
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import {
  createAbroadInquiry,
  getAllStreams,
  getAllConductBy,
} from "./formService";
import { getAllCourses } from "../../Settings/CourseService";
import { getAllStaff } from "../../Branch/StaffService";
import axiosInstance from "../../Common/axiosConfig";
import staffAxiosInstance from "../../Utils/axiosConfig";
import "../../Common/Design.css";
import AlertService from "../../Common/AlertService";

const initialState = {
  // Basic Information
  name: "",
  phone_no: "",
  email: "",
  gender: "",
  dob: "",
  hasPassport: "",
  passportNo: "",

  // Education Information
  passoutCourse: "",
  percentage: "",
  passoutYear: "",
  gap: "",
  gapYear: "",

  // Stream fields
  stream: "",
  streamName: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  district: "",

  // Course Information
  applyFor: "",
  course: "",
  university: "",
  collage: "",

  // Location Information
  continent: "",
  country: "",

  // Family Information
  fathersOccupation: "",
  fathersIncome: "",
  fatherNumber: "",
  fatherITR: "",
  amountITR: "",
  yearITR: "",

  // Additional Fields
  status: "pending",
  source: "",
  remark: "",
  loanRequirement: "",
  year: "",
  amount: "",
  conductBy: "", // Added Conducted By field
  // File Uploads
  photo: null,
  documents: [], // Initialize as empty array
  staffName: "",
};

export default function AbroadInquiryForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [conductByOptions, setConductByOptions] = useState([]);
  const [continentOptions, setContinentOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [universityOptions, setUniversityOptions] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]); // Internal state as 'college' for clarity
  const [courseOptions, setCourseOptions] = useState([]);
  const [streamOptions, setStreamOptions] = useState([]);
  const [selectedStream, setSelectedStream] = useState("");
  const [staffOptions, setStaffOptions] = useState([]);
  const [branchCodeByEmail, setBranchCodeByEmail] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Document upload dialog state
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [document1, setDocument1] = useState(null);
  const [document2, setDocument2] = useState(null);

  const email = sessionStorage.getItem("email");
  const role = sessionStorage.getItem("role");

  // Initial data fetch - only load continents
  useEffect(() => {
    const fetchContinents = async () => {
      try {
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
        };

        console.log("Fetching continents with params:", params);
        const response = await axiosInstance.get("/getAllContinents", {
          params,
          paramsSerializer: (params) => {
            return Object.entries(params)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join("&");
          },
        });
        console.log("Continents API Response:", response.data);
        setContinentOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching continents:", error);
        message.error("Failed to load continents");
      }
    };

    fetchContinents();
  }, []);

  // Document upload dialog handlers
  const handleDocumentDialogOpen = () => {
    setDocumentDialogOpen(true);
  };

  const handleDocumentDialogClose = () => {
    setDocumentDialogOpen(false);
    setSelectedFiles([]);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    // Check if adding these files would exceed the 2 document limit
    const currentDocCount = (document1 ? 1 : 0) + (document2 ? 1 : 0);
    const availableSlots = 2 - currentDocCount;

    if (files.length > availableSlots) {
      AlertService.error(
        `You can only upload ${availableSlots} more document(s). Maximum limit is 2 documents.`,
      );
      return;
    }

    setSelectedFiles(files.slice(0, availableSlots));
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDocuments = () => {
    if (selectedFiles.length > 0) {
      // Assign files to document1 and document2
      if (!document1 && selectedFiles.length > 0) {
        setDocument1(selectedFiles[0]);
      }
      if (!document2 && selectedFiles.length > 1) {
        setDocument2(selectedFiles[1]);
      } else if (!document2 && selectedFiles.length === 1 && document1) {
        setDocument2(selectedFiles[0]);
      }

      setSelectedFiles([]);
      setDocumentDialogOpen(false);
      AlertService.success(
        `${selectedFiles.length} document(s) added successfully!`,
      );
    }
  };

  const handleRemoveDocument = (documentNumber) => {
    if (documentNumber === 1) {
      setDocument1(null);
    } else if (documentNumber === 2) {
      setDocument2(null);
    }
  };

  const handleViewDocument = (documentNumber) => {
    const document = documentNumber === 1 ? document1 : document2;
    if (document) {
      const url = URL.createObjectURL(document);
      window.open(url, "_blank");
    }
  };

  const handleViewSelectedDocument = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
    }
  };

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    console.log("Field changed:", { name, value, type: typeof value });

    // Handle document uploads - this is now handled by the dialog
    if (name === "documents") {
      return;
    }

    // Handle stream selection
    if (name === "stream") {
      const selected = streamOptions.find((s) => String(s.id) === value);
      setSelectedStream(selected || null);
      setForm((prev) => ({
        ...prev,
        stream: value,
        streamName: selected ? selected.name : "",
      }));
      return;
    }

    // Reset dependent fields when parent changes
    const resetFields = {};
    const resetDependentFields = (fields) => {
      fields.forEach((field) => (resetFields[field] = ""));
    };

    const fieldDependencies = {
      continent: ["country", "state", "city", "university", "collage"],
      country: ["state", "city", "university", "collage"],
      state: ["city", "university", "collage"],
      city: ["university", "collage"],
      university: ["collage"],
    };

    if (fieldDependencies[name]) {
      resetDependentFields(fieldDependencies[name]);
    }

    // Handle different input types
    let newValue = value;

    // Convert empty strings to null for better handling
    if (value === "") {
      newValue = null;
    }
    // Convert number fields to actual numbers
    else if (
      [
        "continent",
        "country",
        "state",
        "city",
        "university",
        "collage",
        "stream",
        "pincode",
        "percentage",
        // REMOVE 'passoutYear' from this list to keep it as string
        "gapYear",
        "year",
        "amount",
        "fathersIncome",
        "amountITR",
        "yearITR",
      ].includes(name)
    ) {
      const numValue = Number(value);
      newValue = isNaN(numValue) ? null : numValue;
    }
    // Keep course as string to match dropdown value
    else if (name === "course") {
      newValue = value; // Keep as string (course name)
    }

    // Handle file uploads
    if (name === "photo") {
      setForm((prev) => ({ ...prev, photo: files[0] }));
      return;
    }

    // Handle checkboxes
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // Update the form state
    setForm((prev) => ({
      ...prev,
      [name]: newValue,
      ...resetFields,
    }));
  };

  // Fetch countries based on selected continent
  useEffect(() => {
    const fetchCountries = async () => {
      if (!form.continent) {
        console.log("No continent selected, resetting countries");
        setCountryOptions([]);
        return;
      }
      try {
        const continentId = Number(form.continent);
        if (isNaN(continentId) || continentId <= 0) {
          console.error("Invalid continent ID:", form.continent);
          setCountryOptions([]);
          return;
        }

        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          continentId: continentId,
        };
        console.log("Fetching countries with params:", params);
        const res = await axiosInstance.get("/getAllCountries", {
          params,
          paramsSerializer: (params) => {
            return Object.entries(params)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join("&");
          },
        });
        console.log("Countries API Response:", res.data);
        setCountryOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching countries:", error);
        message.error("Failed to load countries");
      }
    };
    fetchCountries();
  }, [form.continent]);

  // Fetch states based on selected country
  useEffect(() => {
    const fetchStates = async () => {
      if (!form.country) {
        setStateOptions([]);
        setForm((prev) => ({ ...prev, state: "" }));
        return;
      }
      try {
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          countryId: form.country,
        };
        console.log("Fetching states with params:", params);
        const res = await axiosInstance.get("/getAllStates", { params });
        console.log("States API Response:", res.data);

        // Log the first state object to see its structure
        if (res.data && res.data.length > 0) {
          console.log("First state object:", res.data[0]);
          console.log("State object keys:", Object.keys(res.data[0]));
        }

        // Transform the data to ensure consistent structure
        const states =
          res.data?.map((state) => {
            // Try to find the name property by checking all possible variations
            const stateName =
              state.stateName ||
              state.state ||
              state.name ||
              state.StateName ||
              state.State ||
              state.Name ||
              "Unnamed State";

            return {
              id: state.id || state.stateId || state.Id || state.StateId,
              name: stateName,
            };
          }) || [];

        setStateOptions(states);
      } catch (error) {
        console.error("Error fetching states:", error);
        message.error("Failed to load states");
        setStateOptions([]);
      }
    };
    fetchStates();
  }, [form.country]);

  // Fetch cities based on selected state
  useEffect(() => {
    const fetchCities = async () => {
      if (!form.state) {
        setCityOptions([]);
        setForm((prev) => ({ ...prev, city: "" }));
        return;
      }
      try {
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          stateId: form.state,
        };
        console.log("Fetching cities with params:", params);
        const res = await axiosInstance.get("/getAllCities", { params });
        console.log("Cities API Response:", res.data);

        // Log the first city object to see its structure
        if (res.data && res.data.length > 0) {
          console.log("First city object:", res.data[0]);
          console.log("City object keys:", Object.keys(res.data[0]));
        }

        // Transform the data to ensure consistent structure
        const cities =
          res.data?.map((city) => {
            // Try to find the name property by checking all possible variations
            const cityName =
              city.cityName ||
              city.city ||
              city.name ||
              city.CityName ||
              city.City ||
              city.Name ||
              "Unnamed City";

            return {
              id: city.id || city.cityId || city.Id || city.CityId,
              name: cityName,
            };
          }) || [];

        setCityOptions(cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
        message.error("Failed to load cities");
        setCityOptions([]);
      }
    };
    fetchCities();
  }, [form.state]);

  // Fetch universities based on selected city
  useEffect(() => {
    const fetchUniversities = async () => {
      if (!form.city) {
        setUniversityOptions([]);
        return;
      }
      try {
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          cityId: form.city,
        };
        const res = await axiosInstance.get("/getAllUniversities", { params });
        setUniversityOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching universities:", error);
        message.error("Failed to load universities");
      }
    };
    fetchUniversities();
  }, [form.city]);

  // Fetch colleges based on selected university
  useEffect(() => {
    const fetchColleges = async () => {
      if (!form.university) {
        setCollegeOptions([]);
        return;
      }
      try {
        const universityId = Number(form.university);
        if (isNaN(universityId) || universityId <= 0) {
          console.error("Invalid university ID:", form.university);
          setCollegeOptions([]);
          return;
        }

        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          universityId: form.university,
        };
        const res = await axiosInstance.get("/getAllColleges", { params });
        setCollegeOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        message.error("Failed to load colleges");
      }
    };
    fetchColleges();
  }, [form.university]);

  // Fetch all streams and conduct by options on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch streams
        const streams = await getAllStreams();
        console.log("Fetched streams:", streams);
        setStreamOptions(Array.isArray(streams) ? streams : []);

        // Fetch conduct by options
        const conductByData = await getAllConductBy();
        console.log("Fetched conduct by options:", conductByData);
        // Handle case where API returns an array of objects with conductBy property
        const options = Array.isArray(conductByData)
          ? conductByData.map((item) => ({
              id: item.id,
              name: item.conductBy,
            }))
          : [];
        setConductByOptions(options);
      } catch (error) {
        console.error("Error fetching data:", error);
        AlertService.error("Failed to load data");
      }
    };

    fetchInitialData();
  }, []);

  // Fetch branch code for logged-in staff email and then load staff list for that branch
  useEffect(() => {
    const fetchBranchAndStaff = async () => {
      try {
        if (!email) return;
        // Prefer existing branchCode from session if available
        let branchCode = sessionStorage.getItem("branchCode") || "";
        if (!branchCode) {
          // Fallback to API on 8080 base (staff service)
          const res = await staffAxiosInstance.get("/staff/getbranchcode", {
            params: { email },
          });
          branchCode = res?.data || "";
        }
        setBranchCodeByEmail(branchCode);
        if (branchCode) {
          const staffList = await getAllStaff(branchCode);
          const options = Array.isArray(staffList)
            ? staffList.map((s) => ({
                id: s.id,
                name: s.staffName || s.name || s.fullName || "Unnamed",
                email: s.staffName || s.email,
              }))
            : [];
          setStaffOptions(options);
        } else {
          setStaffOptions([]);
        }
      } catch (error) {
        console.error("Error fetching branch code/staff:", error);
        setStaffOptions([]);
      }
    };
    fetchBranchAndStaff();
  }, [email]);

  // Fetch all courses on component mount
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const courses = await getAllCourses();
        console.log("Fetched courses:", courses);
        // Ensure we have an array of courses and map to required format if needed
        const formattedCourses = Array.isArray(courses)
          ? courses.map((course) => ({
              id: course.id,
              courseName: course.courseName || course.name || "Unnamed Course",
              ...course,
            }))
          : [];
        console.log("Formatted courses with courseName:", formattedCourses);
        setCourseOptions(formattedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        AlertService.error("Failed to load courses");
        setCourseOptions([]);
      }
    };
    fetchAllCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    // Validate required fields
    if (
      !form.continent ||
      !form.country ||
      !form.state ||
      !form.city ||
      !form.university ||
      !form.collage ||
      !form.course
    ) {
      AlertService.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    // Validate phone number
    if (!form.phone_no || form.phone_no.length !== 10) {
      AlertService.error("Please enter a valid 10-digit phone number");
      setLoading(false);
      return;
    }

    // Validate document count if needed
    const documentCount = (document1 ? 1 : 0) + (document2 ? 1 : 0);
    if (documentCount > 2) {
      AlertService.error("Maximum 2 documents can be uploaded");
      setLoading(false);
      return;
    }

    try {
      // Get the selected options with their full details
      const [
        selectedContinent,
        selectedCountry,
        selectedState,
        selectedCity,
        selectedUniversity,
        selectedCollege,
        selectedCourse,
        streamData,
      ] = await Promise.all([
        continentOptions.find((c) => String(c.id) === form.continent) || {},
        countryOptions.find((c) => String(c.id) === form.country) || {},
        stateOptions.find((s) => String(s.id) === form.state) || {},
        cityOptions.find((c) => String(c.id) === form.city) || {},
        universityOptions.find((u) => String(u.id) === form.university) || {},
        collegeOptions.find((c) => String(c.id) === form.collage) || {},
        courseOptions.find((c) => c.courseName === form.course) || {},
        form.stream ? getStreamById(form.stream) : Promise.resolve(null),
      ]);

      // Update selectedStream with the fetched data
      setSelectedStream(streamData || null);

      // First, validate that all required fields are present
      const requiredFields = [
        { key: "continent", value: form.continent, name: "Continent" },
        { key: "country", value: form.country, name: "Country" },
        { key: "state", value: form.state, name: "State" },
        { key: "city", value: form.city, name: "City" },
        { key: "university", value: form.university, name: "University" },
        { key: "collage", value: form.collage, name: "College" },
        { key: "course", value: form.course, name: "Course" }, // Still validate course selection
        { key: "stream", value: form.stream, name: "Stream" },
      ];

      // Check for missing fields
      const missingFields = requiredFields.filter(({ value }) => !value);
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(({ name }) => name).join(", ");
        const errorMessage = `Please select: ${fieldNames}`;
        AlertService.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Convert and validate all IDs
      const ids = {};
      const validationErrors = [];

      requiredFields.forEach(({ key, name }) => {
        const value = form[key];

        // Handle course differently (keep as string)
        if (key === "course") {
          if (!value) {
            validationErrors.push(`${name} is required`);
          } else {
            ids[`${key}Id`] = value; // Keep as string (course name)
          }
        } else {
          const numValue = Number(value);

          if (isNaN(numValue) || numValue <= 0) {
            validationErrors.push(`${name} has an invalid ID: ${value}`);
          } else {
            ids[`${key}Id`] = numValue;
          }
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
      }

      // Get display names for location fields with proper null checks
      const continentName =
        selectedContinent?.continentname || selectedContinent?.name || null;
      const countryName =
        selectedCountry?.country ||
        selectedCountry?.countryname ||
        selectedCountry?.name ||
        null;
      const stateName =
        selectedState?.state ||
        selectedState?.stateName ||
        selectedState?.name ||
        null;
      const cityName =
        selectedCity?.city ||
        selectedCity?.cityName ||
        selectedCity?.name ||
        null;
      const universityName =
        selectedUniversity?.universityName ||
        selectedUniversity?.university ||
        selectedUniversity?.name ||
        null;

      // Get the selected course details
      console.log("Course name from form:", form.course);
      console.log("Course name as string:", ids.courseId);
      console.log("Available course options:", courseOptions);
      const selectedCourseForSubmission = courseOptions.find(
        (course) => course.courseName === form.course,
      );
      console.log(
        "Selected course for submission:",
        selectedCourseForSubmission,
      );
      const finalCourseName =
        form.course || selectedCourseForSubmission?.courseName || null;

      // Get the selected college details
      const selectedCollegeForSubmission = collegeOptions.find(
        (college) => college.id === ids.collageId,
      );
      const finalCollegeName =
        selectedCollegeForSubmission?.collegeName ||
        selectedCollegeForSubmission?.name ||
        null;
      const collegeId = selectedCollegeForSubmission?.id || null;

      // Get the selected stream name
      const selectedStream = streamOptions.find(
        (s) => String(s.id) === form.stream,
      );
      const selectedStreamName = selectedStream
        ? selectedStream.streamName || selectedStream.name
        : null;

      console.log("Selected Stream:", selectedStream);
      console.log("Selected Stream Name:", selectedStreamName);
      console.log("Form Stream Value:", form.stream);

      const address = [
        form.houseNo,
        form.street,
        form.landmark,
        cityName || "",
        stateName || "",
        form.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      // Resolve selected staff details
      const selectedStaff = staffOptions.find(
        (s) => s.email === form.staffName,
      );
      const selectedStaffName = selectedStaff?.name || null;

      const enquiryData = {
        // Contact Information
        name: form.name || null,
        phone_no: form.phone_no ? parseInt(form.phone_no) : null,
        email: form.email || null,
        gender: form.gender || null,
        dob: form.dob ? new Date(form.dob).toISOString().split("T")[0] : null,

        // Address Information
        address: address || null,
        landmark: form.landmark || null,
        city: cityName || null,
        state: stateName || null,
        district: form.district || cityName || null,
        pincode: form.pincode || null,

        // Location Information
        continent: continentName || null,
        country: countryName || null,
        university: universityName || null,
        collage: finalCollegeName || null,
        courseName: finalCourseName || null,
        stream: selectedStreamName || null,

        // Education Information
        passoutCourse: form.passoutCourse || null,
        percentage: form.percentage ? parseFloat(form.percentage) : 0.0,
        passoutYear: form.passoutYear || null,
        gap: form.gap || null,
        gapYear: form.gapYear || null,
        applyFor: form.applyFor || null,

        // Family Information
        fathersOccupation: form.fathersOccupation || null,
        fathersIncome: form.fathersIncome
          ? parseFloat(form.fathersIncome)
          : 0.0,
        fatherNumber: form.fatherNumber || null,
        fatherITR: form.fatherITR || null,
        yearITR: form.yearITR || null,
        amountITR: form.amountITR || null,

        // Additional Fields
        status: form.status || "pending",
        source: form.source || null,
        remark: form.remark || null,
        loanRequirement: form.loanRequirement || null,
        year: form.year || null,
        amount: form.amount || null,
        hasPassport: form.hasPassport || null,
        passportNo: form.passportNo || null,
        conductBy: form.conductBy || null,
        staffName: form.staffName || null,
        staffName: selectedStaffName,

        // System Fields
        enquiry_date: new Date().toISOString().split("T")[0],
        createdByEmail: email,
        role: role,
        branchCode: sessionStorage.getItem("branchCode") || "",
      };

      // Log the details for debugging
      console.log(
        "Selected Course for submission:",
        selectedCourseForSubmission,
      );
      console.log("Course Name to be sent:", finalCourseName);
      console.log("Selected College:", selectedCollegeForSubmission);
      console.log("College Name to be sent:", finalCollegeName);
      console.log("College ID to be sent:", collegeId);

      // Prepare the data to be sent to the backend
      const submissionData = {
        ...enquiryData,
        // Add all IDs with proper naming
        continent: continentName || null,
        continentId: ids.continentId,
        country: countryName || null,
        countryId: ids.countryId,
        state: stateName || null,
        stateId: ids.stateId,
        city: cityName || null,
        cityId: ids.cityId,
        university: universityName || null,
        universityId: ids.universityId,
        collage: finalCollegeName || null,
        // Include college ID as a separate field for the backend relationship
        abroadCollege: { id: ids.collageId },
        courseName: finalCourseName,
        courseId: selectedCourseForSubmission?.id || null,
        // Don't include stream in the IDs object as we're sending the name directly
        // Include the photo if it exists
        photo: form.photo,
        // Include documents as File objects for FormData
        document1: document1,
        document2: document2,
        conductBy: form.conductBy, // Add Conducted By to submission
        staffName: form.staffName || null,
        staffName: selectedStaffName,
        // Add any additional fields that should be in the enquiry
        enquiry_date: new Date().toISOString().split("T")[0],
        createdByEmail: email,
        role: role,
        branchCode: sessionStorage.getItem("branchCode") || "",
      };

      // Log the final submission data for debugging
      console.log(
        "Final submission data:",
        JSON.stringify(submissionData, null, 2),
      );

      // Send the data to the service
      await createAbroadInquiry(submissionData, email, role);
      AlertService.success("Inquiry created successfully!");
      setForm(initialState);
      setDocument1(null);
      setDocument2(null);
    } catch (err) {
      console.error("Error creating enquiry:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create inquiry";
      AlertService.error(errorMessage);
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const commonFont = { fontFamily: "Poppins, Helvetica, sans-serif" };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid
        container
        spacing={2}
        className="textField-root"
      >
        {/* Name */}
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Phone No"
            name="phone_no"
            value={form.phone_no || ""}
            onChange={(e) => {
              // Allow only numbers and limit to 10 digits
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              handleChange({
                target: {
                  name: "phone_no",
                  value: value,
                },
              });
            }}
            onBlur={(e) => {
              // Add validation on blur
              const value = e.target.value;
              if (value && value.length !== 10) {
                setForm((prev) => ({ ...prev, phone_no: value }));
              }
            }}
            fullWidth
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">+91</InputAdornment>
              ),
            }}
            error={!!(form.phone_no && form.phone_no.length !== 10)}
            helperText={
              form.phone_no && form.phone_no.length !== 10
                ? "Please enter a valid 10-digit mobile number"
                : ""
            }
          />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Status"
            name="status"
            value={form.status || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            required
            sx={{
              "& .MuiSelect-select": {
                color:
                  form.status === "pending"
                    ? "green"
                    : form.status === "approved"
                      ? "red"
                      : form.status === "connecting"
                        ? "orange"
                        : form.status === "ringing"
                          ? "gold"
                          : form.status === "callBack"
                            ? "lightgreen"
                            : form.status === "office_visit"
                              ? "purple"
                              : form.status === "processing"
                                ? "blue"
                                : form.status === "application"
                                  ? "maroon"
                                  : form.status === "CNI"
                                    ? "pink"
                                    : "inherit",
                textTransform: "uppercase",
              },
            }}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem
              value="pending"
              sx={{ color: "green", textTransform: "uppercase" }}
            >
              INTERESTED
            </MenuItem>
            <MenuItem
              value="approved"
              sx={{ color: "red", textTransform: "uppercase" }}
            >
              NOT INTERESTED
            </MenuItem>
            <MenuItem
              value="connecting"
              sx={{ color: "orange", textTransform: "uppercase" }}
            >
              CONNECTING
            </MenuItem>
            <MenuItem
              value="ringing"
              sx={{ color: "gold", textTransform: "uppercase" }}
            >
              RINGING / SWITCH OFF
            </MenuItem>
            <MenuItem
              value="callBack"
              sx={{ color: "lightgreen", textTransform: "uppercase" }}
            >
              CALL BACK
            </MenuItem>
            <MenuItem
              value="office_visit"
              sx={{ color: "purple", textTransform: "uppercase" }}
            >
              Office Visit
            </MenuItem>
            <MenuItem
              value="processing"
              sx={{ color: "blue", textTransform: "uppercase" }}
            >
              processing
            </MenuItem>
            <MenuItem
              value="CNI"
              sx={{ color: "pink", textTransform: "uppercase" }}
            >
              CNI
            </MenuItem>
            <MenuItem
              value="application"
              sx={{ color: "maroon", textTransform: "uppercase" }}
            >
              application
            </MenuItem>
          </TextField>
        </Grid>

        {/* Passport Information */}
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Do you have Passport?"
            name="hasPassport"
            value={form.hasPassport || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>

        {form.hasPassport === "Yes" && (
          <Grid item xs={12} sm={2.4}>
            <TextField
              label="Passport Number"
              name="passportNo"
              value={form.passportNo || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Passout Course"
            name="passoutCourse"
            value={form.passoutCourse}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
          >
            <MenuItem value="">Select</MenuItem>
            {[
              "10th",
              "12th",
              "ITI",
              "Diploma",
              "BA",
              "B.Com",
              "B.Sc",
              "BBA",
              "BCA",
              "MA",
              "M.Com",
              "MSc",
              "PHD",
              "BE",
              "B.Tech",
              "M.Tech",
              "ME",
              "Other",
            ].map((course) => (
              <MenuItem key={course} value={course}>
                {course}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Percentage"
            name="percentage"
            value={form.percentage}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Apply For"
            name="applyFor"
            value={form.applyFor}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Certificate">Certificate</MenuItem>
            <MenuItem value="Diploma">Diploma</MenuItem>
            <MenuItem value="UG">UG</MenuItem>
            <MenuItem value="PG">PG</MenuItem>
            <MenuItem value="PHD">PHD</MenuItem>
            <MenuItem value="Visa Application">Visa Application</MenuItem>
            <MenuItem value="Passport">Passport</MenuItem>
            <MenuItem value="Job Abroad">Job Abroad</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Stream"
            name="stream"
            value={form.stream || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            required
            // error={!form.stream}
            // helperText={!form.stream ? 'Stream is required' : ''}
          >
            <MenuItem value="">Select</MenuItem>
            {streamOptions.map((stream) => (
              <MenuItem key={stream.id} value={String(stream.id)}>
                {stream.streamName || stream.name || "Unnamed Stream"}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Course"
            name="course"
            value={form.course}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
          >
            <MenuItem value="">Select</MenuItem>
            {courseOptions.map((course) => (
              <MenuItem key={course.id} value={course.courseName}>
                {course.courseName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
                    <Grid item xs={12} sm={2.4}>
              <TextField
                label="Continent"
                name="continent"
                value={form.continent}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                {continentOptions.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.continentname || c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                {countryOptions.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.country || c.countryname || c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
                required
              >
                <MenuItem value="">Select</MenuItem>
                {stateOptions.map((state) => (
                  <MenuItem key={state.id} value={state.id}>
                    {state.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
                required
              >
                <MenuItem value="">Select</MenuItem>
                {cityOptions.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="University"
                name="university"
                value={form.university}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                {universityOptions.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.universityName || u.university || u.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="College"
                name="collage"
                value={form.collage}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
                required
              >
                <MenuItem value="">Select</MenuItem>
                {collegeOptions.map((college) => (
                  <MenuItem key={college.id} value={String(college.id)}>
                    {college.collegeName || college.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

        {/* Source Field */}
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Source"
            name="source"
            value={form.source}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Walk-In">Walk-In</MenuItem>
            <MenuItem value="Call">Call</MenuItem>
            <MenuItem value="WhatsApp">WhatsApp</MenuItem>
            <MenuItem value="Instagram">Instagram</MenuItem>
            <MenuItem value="TV Ads">TV Ads</MenuItem>
            <MenuItem value="NewsPaper">NewsPaper</MenuItem>
            <MenuItem value="Facebook">Facebook</MenuItem>
            <MenuItem value="Youtube">Youtube</MenuItem>
          </TextField>
        </Grid>

        {/* <Grid item xs={12} sm={2.4}>
          <TextField
            label="Conducted By"
            name="conductBy"
            value={form.conductBy || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            {conductByOptions.map((item) => (
              <MenuItem key={item.id} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid> */}

        {/* Staff dropdown (depends on Conducted By selection contextually, but populated by branch code) */}
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Staff"
            name="staffName"
            value={form.staffName || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            required
            helperText={
              branchCodeByEmail ? undefined : "No branch code found for user"
            }
          >
            <MenuItem value="">Select</MenuItem>
            {staffOptions.map((staff) => (
              <MenuItem key={staff.id || staff.email} value={staff.email}>
                {staff.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Status Field */}

        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Remarks"
            name="remark"
            value={form.remark}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography
            onClick={() => setShowMore(!showMore)}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              color: showMore ? "red" : "green",
              mt: 2,
            }}
          >
            {showMore ? "See Less ▲" : "See More ▼"}
          </Typography>
        </Grid>

        {showMore && (
          <>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="DOB"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Passout Year"
                name="passoutYear"
                value={form.passoutYear || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                {[
                  "2019-2020",
                  "2020-2021",
                  "2021-2022",
                  "2022-2023",
                  "2023-2024",
                  "2024-2025",
                  "2025-2026",
                ].map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* GAP Information */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Have GAP in Education?"
                name="gap"
                value={form.gap || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Grid>

            {form.gap === "Yes" && (
              <Grid item xs={12} sm={2.4}>
                <TextField
                  label="GAP Year"
                  name="gapYear"
                  value={form.gapYear || ""}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  select
                >
                  <MenuItem value="">Select</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                    (year) => (
                      <MenuItem key={year} value={year}>
                        {year} {year > 1 ? "years" : "year"}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="House/Flat No."
                name="houseNo"
                value={form.houseNo || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Street Name"
                name="street"
                value={form.street || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Landmark"
                name="landmark"
                value={form.landmark || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Pincode"
                name="pincode"
                value={form.pincode || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>

            {/* Last Row - Occupation, Income, Upload & Submit */}
            {/* Last Row - Occupation, Income, Upload & Submit */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Father's Occupation"
                name="fathersOccupation"
                value={form.fathersOccupation || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Father's Income"
                name="fathersIncome"
                value={form.fathersIncome || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Father's Phone Number"
                name="fatherNumber"
                value={form.fatherNumber || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>

            {/* ITR Fields */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Father's ITR"
                name="fatherITR"
                value={form.fatherITR || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Grid>

            {form.fatherITR === "Yes" && (
              <>
                <Grid item xs={12} sm={2.4}>
                  <TextField
                    label="ITR Amount"
                    name="amountITR"
                    value={form.amountITR || ""}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <TextField
                    label="ITR Year"
                    name="yearITR"
                    value={form.yearITR || ""}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    select
                  >
                    <MenuItem value="">Select</MenuItem>
                    {[1, 2, 3, 4].map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={2.4}>
              <TextField
                label="Loan Requirement"
                name="loanRequirement"
                value={form.loanRequirement}
                onChange={(e) => {
                  // Reset loan amount and year if requirement is not 'Yes'
                  const newValue = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    loanRequirement: newValue,
                    ...(newValue !== "Yes" ? { amount: "", year: "" } : {}),
                  }));
                }}
                fullWidth
                margin="normal"
                select
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Maybe">Maybe</MenuItem>
              </TextField>
            </Grid>

            {form.loanRequirement === "Yes" && (
              <>
                <Grid item xs={12} sm={2.4}>
                  <TextField
                    label="Loan Amount"
                    name="amount"
                    value={form.amount || ""}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <TextField
                    label="Loan Year"
                    name="year"
                    value={form.year || ""}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                    select
                  >
                    {/* Dropdown options */}
                    {[1, 2, 3, 4, 5, 6].map((yearOption) => (
                      <MenuItem key={yearOption} value={yearOption}>
                        {yearOption}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={2.4}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    component="label"
                    fullWidth
                    sx={{ fontFamily: "Poppins", borderRadius: 2, mb: 1 }}
                  >
                    Upload Photo
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      hidden
                      onChange={handleChange}
                    />
                  </Button>
                  {form.photo && (
                    <Typography variant="body2" sx={{ mt: 1, ...commonFont }}>
                      {form.photo.name}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleDocumentDialogOpen}
                    fullWidth
                    sx={{ fontFamily: "Poppins", borderRadius: 2, mb: 1 }}
                    startIcon={<CloudUploadIcon />}
                    disabled={document1 && document2 ? true : false}
                  >
                    Upload Documents (
                    {(document1 ? 1 : 0) + (document2 ? 1 : 0)}/2)
                  </Button>

                  {/* Document 1 */}
                  {document1 && (
                    <Box
                      sx={{
                        mt: 1,
                        mb: 1,
                        p: 1,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ ...commonFont, fontWeight: "bold" }}
                          >
                            Document 1:
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ ...commonFont, fontSize: "0.75rem" }}
                          >
                            {document1.name} (
                            {(document1.size / 1024 / 1024).toFixed(2)} MB)
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDocument(1)}
                            sx={{ p: 0.5 }}
                            title="View Document"
                          >
                            <CloudUploadIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveDocument(1)}
                            sx={{ p: 0.5 }}
                            title="Remove Document"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Document 2 */}
                  {document2 && (
                    <Box
                      sx={{
                        mt: 1,
                        mb: 1,
                        p: 1,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ ...commonFont, fontWeight: "bold" }}
                          >
                            Document 2:
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ ...commonFont, fontSize: "0.75rem" }}
                          >
                            {document2.name} (
                            {(document2.size / 1024 / 1024).toFixed(2)} MB)
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDocument(2)}
                            sx={{ p: 0.5 }}
                            title="View Document"
                          >
                            <CloudUploadIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveDocument(2)}
                            sx={{ p: 0.5 }}
                            title="Remove Document"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
            sx={{ mt: 1, fontFamily: "Poppins", borderRadius: 2 }}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
          {msg && (
            <Typography
              sx={{ mt: 1, ...commonFont }}
              color={msg.includes("success") ? "green" : "red"}
            >
              {msg}
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Document Upload Dialog */}
      <Dialog
        open={documentDialogOpen}
        onClose={handleDocumentDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "Poppins" }}>
          Upload Documents
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ mb: 2, fontFamily: "Poppins", color: "text.secondary" }}
            >
              Current Documents: {(document1 ? 1 : 0) + (document2 ? 1 : 0)}/2
            </Typography>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUploadIcon />}
              sx={{ fontFamily: "Poppins", borderRadius: 2, mb: 2 }}
              disabled={document1 && document2 ? true : false}
            >
              Select Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                hidden
                onChange={handleFileSelect}
              />
            </Button>

            {selectedFiles.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontFamily: "Poppins" }}
                >
                  Selected Files ({selectedFiles.length}):
                </Typography>
                <List dense>
                  {selectedFiles.map((file, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        sx={{ fontFamily: "Poppins" }}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            edge="end"
                            onClick={() => handleViewSelectedDocument(file)}
                            size="small"
                            title="View Document"
                          >
                            <CloudUploadIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFile(index)}
                            size="small"
                            title="Remove File"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleDocumentDialogClose}
            sx={{ fontFamily: "Poppins" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddDocuments}
            variant="contained"
            disabled={selectedFiles.length === 0}
            sx={{ fontFamily: "Poppins" }}
          >
            Add Documents
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
