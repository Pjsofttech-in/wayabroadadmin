import React, { useState, useEffect } from "react";
import "./InquiryEdit.css";
import { 
  Button, 
  Box, 
  Grid, 
  TextField, 
  MenuItem, 
  Typography 
} from "@mui/material";
// Removed unused import
import { createAbroadInquiry, getAllStreams, getAllConductBy } from "./formService";
import { getAllCourses } from "../../Settings/CourseService";
import { getAllStaff } from "../../Branch/StaffService";
import axiosInstance from "../../Common/axiosConfig";
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
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  district: "",
  
  // Course Information
  applyFor: "",
  courseName: "",
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
  staffName: "", // Added Staff Name field
  // File Upload
  photo: null,
};

export default function InquiryEdit({
  initialValues = {},
  onChange,
  onSubmit,
  onDelete,
  onClose,
  isSubmitting = false,
  isEditMode = false,
  isLoading = false
}) {
  const [form, setForm] = useState(() => {
    // For edit mode, ensure we handle college field correctly
    if (isEditMode && initialValues && Object.keys(initialValues).length > 0) {
      // Create a copy of initialValues to avoid mutating the original
      const editValues = { ...initialValues };
      
      // Handle the college field - make sure it's using the correct field name
      if (editValues.collegeName) {
        editValues.collage = editValues.collegeName;
        delete editValues.collegeName;
      }
      
      // Merge with initialState to ensure all fields are present
      return { ...initialState, ...editValues };
    }
    // For create mode, use initialState
    return { ...initialState };
  });

  // Update form when initialValues change (only for create mode or first load)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Create a clean version of initialValues
      const cleanInitialValues = { ...initialValues };
      
      // Convert empty strings to null for better handling
      Object.keys(cleanInitialValues).forEach(key => {
        if (cleanInitialValues[key] === '') {
          cleanInitialValues[key] = null;
        }
      });
      
      // Handle the college field - make sure it's using the correct field name
      if (cleanInitialValues.collegeName) {
        cleanInitialValues.collage = cleanInitialValues.collegeName;
        delete cleanInitialValues.collegeName;
      }
      
      // For edit mode, ensure we preserve the existing form state for dropdowns
      // This prevents overwriting with empty values when dependent data loads
      setForm(prev => {
        const updatedForm = { ...prev, ...cleanInitialValues };
        
        // Preserve the collage ID if it was already set
        if (prev.collage && !updatedForm.collage) {
          updatedForm.collage = prev.collage;
        }
        
        return updatedForm;
      });
    }
  }, [initialValues, isEditMode]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [continentOptions, setContinentOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [universityOptions, setUniversityOptions] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]);  // Internal state as 'college' for clarity
  const [courseOptions, setCourseOptions] = useState([]);
  const [streamOptions, setStreamOptions] = useState([]);
  const [conductByOptions, setConductByOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  // Removed selectedStream state as it's not being used
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
        
        const response = await axiosInstance.get("/getAllContinents", { 
          params,
          paramsSerializer: params => {
            return Object.entries(params)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join('&');
          }
        });
        setContinentOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching continents:", error);
        AlertService.error("Failed to load continents");
      }
    };

    fetchContinents();
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    
    // Handle stream selection
    if (name === 'stream') {
      const selected = streamOptions.find(s => String(s.id) === value);
      
      const updatedForm = {
        ...form,
        stream: selected ? value : ''
      };
      
      setForm(updatedForm);
      if (onChange && !isEditMode) onChange(updatedForm);
      return;
    }
    
    // Reset dependent fields when parent changes
    const resetFields = {};
    const resetDependentFields = (fields) => {
      fields.forEach(field => resetFields[field] = '');
    };

    const fieldDependencies = {
      'continent': ['country', 'state', 'city', 'university', 'collage'],
      'country': ['state', 'city', 'university', 'collage'],
      'state': ['city', 'university', 'collage'],
      'city': ['university', 'collage'],
      'university': ['collage']
    };

    if (fieldDependencies[name]) {
      resetDependentFields(fieldDependencies[name]);
    }
    
    // Handle different input types
    let newValue = value;
    
    // Convert empty strings to null for better handling
    if (value === '') {
      newValue = null;
    }
    // Convert number fields to actual numbers
    else if ([
      'continent', 'country', 'state', 'city', 'university', 'collage', 'stream', 'pincode', 
      // REMOVE 'passoutYear' from this list to keep it as string
      'gapYear', 'year', 'amount', 'fathersIncome', 'amountITR', 'yearITR'
    ].includes(name)) {
      const numValue = Number(value);
      newValue = isNaN(numValue) ? null : numValue;
    }
    // Keep courseName as string to match dropdown value
    else if (name === 'courseName') {
      newValue = value; // Keep as string (courseName name)
    }
    else {
      // For text fields, keep the value as is
      newValue = value;
    }
    
    // Handle file uploads
    if (name === "photo") {
      const updatedForm = { ...form, photo: files[0] };
      setForm(updatedForm);
      if (onChange && !isEditMode) onChange(updatedForm);
      return;
    }
    
    // Handle checkboxes
    if (type === 'checkbox') {
      const updatedForm = { ...form, [name]: checked };
      setForm(updatedForm);
      if (onChange && !isEditMode) onChange(updatedForm);
      return;
    }
    
    // Update the form state
    const updatedForm = {
      ...form,
      [name]: newValue,
      ...resetFields
    };
    
    setForm(updatedForm);
    if (onChange && !isEditMode) onChange(updatedForm);
  };

  // Fetch countries based on selected continent
  useEffect(() => {
    const fetchCountries = async () => {
      if (!form.continent) {
        setCountryOptions([]);
        return;
      }
      try {
        const continentId = Number(form.continent);
        if (isNaN(continentId) || continentId <= 0) {
          setCountryOptions([]);
          return;
        }
        
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          continentId: continentId
        };
        console.log("Fetching countries with params:", params);
        const res = await axiosInstance.get("/getAllCountries", { 
          params,
          paramsSerializer: params => {
            return Object.entries(params)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join('&');
          }
        });
        console.log("Countries API Response:", res.data);
        setCountryOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching countries:", error);
        AlertService.error("Failed to load countries");
      }
    };
    fetchCountries();
  }, [form.continent]);

  // Fetch states based on selected country
  useEffect(() => {
    const fetchStates = async () => {
      if (!form.country || form.country === 'new') {
        setStateOptions([]);
        setForm(prev => ({ ...prev, state: '' }));
        return;
      }
      try {
        const countryId = Number(form.country);
        if (isNaN(countryId) || countryId <= 0) {
          console.error('Invalid country ID:', form.country);
          setStateOptions([]);
          return;
        }
        
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          countryId: countryId
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
        const states = res.data?.map(state => {
          // Try to find the name property by checking all possible variations
          const stateName = state.stateName || state.state || state.name || 
                           state.StateName || state.State || state.Name || 'Unnamed State';
          
          return {
            id: state.id || state.stateId || state.Id || state.StateId,
            name: stateName
          };
        }) || [];
        
        setStateOptions(states);
      } catch (error) {
        console.error("Error fetching states:", error);
        AlertService.error("Failed to load states");
        setStateOptions([]);
      }
    };
    fetchStates();
  }, [form.country]);

  // Fetch cities based on selected state
  useEffect(() => {
    const fetchCities = async () => {
      if (!form.state || form.state === 'new') {
        setCityOptions([]);
        setForm(prev => ({ ...prev, city: '' }));
        return;
      }
      try {
        const stateId = Number(form.state);
        if (isNaN(stateId) || stateId <= 0) {
          console.error('Invalid state ID:', form.state);
          setCityOptions([]);
          return;
        }
        
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          stateId: stateId
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
        const cities = res.data?.map(city => {
          // Try to find the name property by checking all possible variations
          const cityName = city.cityName || city.city || city.name || 
                          city.CityName || city.City || city.Name || 'Unnamed City';
          
          return {
            id: city.id || city.cityId || city.Id || city.CityId,
            name: cityName
          };
        }) || [];
        
        setCityOptions(cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
        AlertService.error("Failed to load cities");
        setCityOptions([]);
      }
    };
    fetchCities();
  }, [form.state]);

  // Fetch universities based on selected city
  useEffect(() => {
    const fetchUniversities = async () => {
      if (!form.city || form.city === 'new') {
        setUniversityOptions([]);
        return;
      }
      try {
        const cityId = Number(form.city);
        if (isNaN(cityId) || cityId <= 0) {
          console.error('Invalid city ID:', form.city);
          setUniversityOptions([]);
          return;
        }
        
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          cityId: cityId
        };
        const res = await axiosInstance.get("/getAllUniversities", { params });
        setUniversityOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching universities:", error);
        AlertService.error("Failed to load universities");
        setUniversityOptions([]);
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
          console.error('Invalid university ID:', form.university);
          setCollegeOptions([]);
          return;
        }
        
        const params = {
          role,
          email,
          branchCode: sessionStorage.getItem("branchCode") || "",
          universityId: universityId
        };
        const res = await axiosInstance.get("/getAllColleges", { params });
        setCollegeOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        AlertService.error("Failed to load colleges");
      }
    };
    fetchColleges();
  }, [form.university]);



  // Fetch all streams on component mount
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const streams = await getAllStreams();
        console.log('Fetched streams:', streams);
        setStreamOptions(Array.isArray(streams) ? streams : []);
      } catch (error) {
        console.error("Error fetching streams:", error);
        AlertService.error("Failed to load streams");
      }
    };
    fetchStreams();
  }, []);

  // Handle stream conversion in edit mode
  useEffect(() => {
    if (isEditMode && initialValues.stream && streamOptions.length > 0) {
      // If stream is a name, find its ID
      if (isNaN(Number(initialValues.stream))) {
        const foundStream = streamOptions.find(s => 
          s.name === initialValues.stream  // AbroadStream.name
        );
        if (foundStream) {
          console.log('Converting stream name to ID:', initialValues.stream, '->', foundStream.id);
          setForm(prev => ({ ...prev, stream: String(foundStream.id) }));
        }
      }
    }
  }, [isEditMode, initialValues.stream, streamOptions]);

  // Fetch all courses on component mount
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const courses = await getAllCourses();
        console.log('Fetched courses:', courses);
        setCourseOptions(Array.isArray(courses) ? courses : []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        AlertService.error("Failed to load courses");
      }
    };

    const fetchConductByOptions = async () => {
      try {
        const conductByData = await getAllConductBy();
        console.log('Fetched conduct by options:', conductByData);
        // Handle case where API returns an array of objects with conductBy property
        const options = Array.isArray(conductByData) 
          ? conductByData.map(item => ({
              id: item.id,
              name: item.conductBy
            })) 
          : [];
        setConductByOptions(options);
      } catch (error) {
        console.error("Error fetching conduct by options:", error);
        AlertService.error("Failed to load conduct by options");
      }
    };

    const fetchStaffOptions = async () => {
      setLoadingStaff(true);
      try {
        // Get the branch code from session storage or use role-based logic
        let branchCodeToUse;
        if (role === 'superAdmin') {
          branchCodeToUse = 'All'; // For super admin, we might want all staff
        } else {
          branchCodeToUse = sessionStorage.getItem('branchCode') || 'All';
        }

        if (branchCodeToUse && branchCodeToUse !== 'All') {
          const staffList = await getAllStaff(branchCodeToUse);
          const options = Array.isArray(staffList)
            ? staffList.map((s) => ({
                id: s.id,
                name: s.staffName || s.name || s.fullName || "Unnamed",
                email: s.staffName || s.email,
                branchCode: s.branchCode
              }))
            : [];
          setStaffOptions(options);
        } else {
          // For super admin or when no specific branch, try to get all staff
          // Since getAllStaff requires a branchCode, we'll use a fallback approach
          setStaffOptions([]);
        }
      } catch (error) {
        console.error('Error fetching staff options:', error);
        setStaffOptions([]);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchAllCourses();
    fetchConductByOptions();
    fetchStaffOptions();
  }, []);

  // Handle courseName conversion in edit mode
  useEffect(() => {
    if (isEditMode && initialValues.courseName && courseOptions.length > 0) {
      // Course should remain as name (not ID) for the dropdown
      // This is handled in the form state, no conversion needed
      console.log('Course value in edit mode:', initialValues.courseName);
    }
  }, [isEditMode, initialValues.courseName, courseOptions]);

  // Handle staffName conversion in edit mode
  useEffect(() => {
    if (isEditMode && initialValues.staffName && staffOptions.length > 0) {
      // If staffName is an email, ensure it matches one of the staff options
      if (initialValues.staffName.includes('@')) {
        const foundStaff = staffOptions.find(staff => staff.email === initialValues.staffName);
        if (foundStaff) {
          // Email matches, keep it as is
          setForm(prev => ({ ...prev, staffName: foundStaff.email }));
        } else {
          // Email doesn't match any staff, try to find by name
          const foundByName = staffOptions.find(staff =>
            staff.name && staff.name.toLowerCase() === initialValues.staffName.toLowerCase()
          );
          if (foundByName) {
            setForm(prev => ({ ...prev, staffName: foundByName.email }));
          } else {
            // No match found, clear the field
            setForm(prev => ({ ...prev, staffName: '' }));
          }
        }
      } else {
        // staffName is not an email, try to find by name
        const foundStaff = staffOptions.find(staff =>
          staff.name && staff.name.toLowerCase() === initialValues.staffName.toLowerCase()
        );
        if (foundStaff) {
          setForm(prev => ({ ...prev, staffName: foundStaff.email }));
        }
      }
    }
  }, [isEditMode, initialValues.staffName, staffOptions]);

  // Additional useEffect to handle form updates when dependent options are loaded
  useEffect(() => {
    if (isEditMode && initialValues) {
      let updates = {};
      
      // Check if we need to update state
      if (initialValues.state && stateOptions.length > 0 && isNaN(Number(initialValues.state))) {
        const stateId = findStateIdByName(stateOptions, initialValues.state);
        if (stateId) {
          updates.state = stateId;
        }
      }
      
      // Check if we need to update city
      if (initialValues.city && cityOptions.length > 0 && isNaN(Number(initialValues.city))) {
        const cityId = findCityIdByName(cityOptions, initialValues.city);
        if (cityId) {
          updates.city = cityId;
        }
      }
      
      // Check if we need to update collage
      if (initialValues.collage && collegeOptions.length > 0 && isNaN(Number(initialValues.collage))) {
        const collegeId = findCollegeIdByName(collegeOptions, initialValues.collage);
        if (collegeId) {
          updates.collage = collegeId;
        }
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        console.log('Applying additional form updates:', updates);
        setForm(prev => ({ ...prev, ...updates }));
      }
    }
  }, [isEditMode, initialValues, stateOptions, cityOptions, collegeOptions]);

  // Helper functions for the additional useEffect
  const findStateIdByName = (states, name) => {
    if (!name || !states || states.length === 0) return null;
    const found = states.find(state => 
      state.state === name  // AbroadState.state
    );
    return found ? found.id : null;
  };

  const findCityIdByName = (cities, name) => {
    if (!name || !cities || cities.length === 0) return null;
    const found = cities.find(city => 
      city.city === name  // AbroadCity.city
    );
    return found ? found.id : null;
  };

  const findCollegeIdByName = (colleges, name) => {
    if (!name || !colleges || colleges.length === 0) return null;
    const found = colleges.find(college => 
      college.collegeName === name  // AbroadCollege.collegeName
    );
    return found ? found.id : null;
  };

  useEffect(() => {
    if (initialValues) {
      const updatedForm = {
        ...initialState,
        ...initialValues
      };
      console.log('Setting initial form values:', updatedForm);
      setForm(updatedForm);
      
      // If there's a stream in initialValues, handle it
      if (initialValues.stream) {
        // Stream is handled in the form state
      }

      // If in edit mode and we have dependent dropdowns to load
      if (isEditMode && initialValues.continent) {
        const loadDependentData = async () => {
          try {
            // Helper function to find ID by name
            const findIdByName = (options, name) => {
              if (!name || !options || options.length === 0) return null;
              const found = options.find(option => 
                option.name === name || 
                option.country === name || 
                option.state === name || 
                option.city === name ||
                option.universityName === name ||
                option.collegeName === name
              );
              return found ? found.id : null;
            };



            // Helper function to find ID by name for continents
            const findContinentIdByName = (name) => {
              if (!name || !continentOptions || continentOptions.length === 0) return null;
              const found = continentOptions.find(option => 
                option.continentname === name || 
                option.name === name
              );
              return found ? found.id : null;
            };

            // Create a form update object to store the IDs we find
            let formUpdates = {};

            // Load countries if continent is selected
            if (initialValues.continent && initialValues.continent !== 'new') {
              let continentId = initialValues.continent;
              
              // If continent is a name, find its ID
              if (isNaN(Number(continentId))) {
                continentId = findContinentIdByName(continentId);
                if (continentId) {
                  formUpdates.continent = continentId;
                }
              }
              
              if (continentId) {
                const countryParams = {
                  role,
                  email,
                  branchCode: sessionStorage.getItem("branchCode") || "",
                  continentId: continentId
                };
                console.log('Fetching countries with params:', countryParams);
                const countriesRes = await axiosInstance.get("/getAllCountries", { params: countryParams });
                setCountryOptions(countriesRes.data || []);

                // Load states if country is selected
                if (initialValues.country && initialValues.country !== 'new') {
                  let countryId = initialValues.country;
                  
                  // If country is a name, find its ID
                  if (isNaN(Number(countryId))) {
                    countryId = findIdByName(countriesRes.data, countryId);
                    if (countryId) {
                      formUpdates.country = countryId;
                    }
                  }
                  
                  if (countryId) {
                    const stateParams = {
                      role,
                      email,
                      branchCode: sessionStorage.getItem("branchCode") || "",
                      countryId: countryId
                    };
                    console.log('Fetching states with params:', stateParams);
                    const statesRes = await axiosInstance.get("/getAllStates", { params: stateParams });
                    const states = statesRes.data?.map(s => ({
                      id: s.id || s.stateId,
                      name: s.state  // AbroadState.state
                    })) || [];
                    setStateOptions(states);

                    // Load cities if state is selected
                    if (initialValues.state && initialValues.state !== 'new') {
                      let stateId = initialValues.state;
                      
                      // If state is a name, find its ID
                      if (isNaN(Number(stateId))) {
                        stateId = findIdByName(states, stateId);
                        if (stateId) {
                          formUpdates.state = stateId;
                        }
                      }
                      
                      if (stateId) {
                        const cityParams = {
                          role,
                          email,
                          branchCode: sessionStorage.getItem("branchCode") || "",
                          stateId: stateId
                        };
                        console.log('Fetching cities with params:', cityParams);
                        const citiesRes = await axiosInstance.get("/getAllCities", { params: cityParams });
                        const cities = citiesRes.data?.map(c => ({
                          id: c.id || c.cityId,
                          name: c.city  // AbroadCity.city
                        })) || [];
                        setCityOptions(cities);

                        // Load universities if city is selected
                        if (initialValues.city && initialValues.city !== 'new') {
                          let cityId = initialValues.city;
                          
                          // If city is a name, find its ID
                          if (isNaN(Number(cityId))) {
                            cityId = findIdByName(cities, cityId);
                            if (cityId) {
                              formUpdates.city = cityId;
                            }
                          }
                          
                          if (cityId) {
                            const universityParams = {
                              role,
                              email,
                              branchCode: sessionStorage.getItem("branchCode") || "",
                              cityId: cityId
                            };
                            console.log('Fetching universities with params:', universityParams);
                            const universitiesRes = await axiosInstance.get("/getAllUniversities", { params: universityParams });
                            setUniversityOptions(universitiesRes.data || []);

                            // Load colleges if university is selected
                            if (initialValues.university && initialValues.university !== 'new') {
                              let universityId = initialValues.university;
                              
                              // If university is a name, find its ID
                              if (isNaN(Number(universityId))) {
                                universityId = findIdByName(universitiesRes.data, universityId);
                                if (universityId) {
                                  formUpdates.university = universityId;
                                }
                              }
                              
                              if (universityId) {
                                const collegeParams = {
                                  role,
                                  email,
                                  branchCode: sessionStorage.getItem("branchCode") || "",
                                  universityId: universityId
                                };
                                console.log('Fetching colleges with params:', collegeParams);
                                const collegesRes = await axiosInstance.get("/getAllColleges", { params: collegeParams });
                                setCollegeOptions(collegesRes.data || []);

                                // Handle college ID conversion
                                if (initialValues.collage && initialValues.collage !== 'new') {
                                  let collegeId = initialValues.collage;
                                  
                                  // If it's a name (string), convert to ID
                                  if (isNaN(Number(collegeId))) {
                                    collegeId = findIdByName(collegesRes.data, collegeId);
                                  }
                                  if (collegeId) {
                                    formUpdates.collage = collegeId;
                                  }
                                }  
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            // Update the form with the found IDs
            if (Object.keys(formUpdates).length > 0) {
              console.log('Updating form with IDs:', formUpdates);
              setForm(prev => {
                const updatedForm = { ...prev, ...formUpdates };
                console.log('Updated form state:', updatedForm);
                return updatedForm;
              });
            }
          } catch (error) {
            console.error("Error loading dependent data:", error);
            AlertService.error("Failed to load dependent data");
          }
        };
        
        loadDependentData();
      }
    }
  }, [initialValues, isEditMode, role, email, continentOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      // In edit mode, pass the form data to the parent component
      if (isEditMode && onSubmit) {
        // Clean the form data for edit mode and convert IDs back to names
        const cleanFormData = { ...form };
        
        // Helper function to find name by ID
        const findNameById = (options, id) => {
          if (!id || !options || options.length === 0) return null;
          const found = options.find(option => String(option.id) === String(id));
          if (!found) return null;
          
          // Return the appropriate name field based on the entity field names
          return found.continentname ||  // AbroadContinent.continentname
                 found.country ||        // AbroadCountry.country
                 found.state ||          // AbroadState.state
                 found.city ||           // AbroadCity.city
                 found.universityName || // AbroadUniversity.universityName
                 found.collegeName ||    // AbroadCollege.collegeName
                 found.name ||           // AbroadStream.name, Staff.name
                 found.courseName ||     // AbroadCourse.courseName
                 found.conductBy;        // ConductBy field
        };

        // Convert IDs back to names for display
        if (cleanFormData.continent && !isNaN(Number(cleanFormData.continent))) {
          const continentName = findNameById(continentOptions, cleanFormData.continent);
          if (continentName) cleanFormData.continent = continentName;
        }

        if (cleanFormData.country && !isNaN(Number(cleanFormData.country))) {
          const countryName = findNameById(countryOptions, cleanFormData.country);
          if (countryName) cleanFormData.country = countryName;
        }

        if (cleanFormData.state && !isNaN(Number(cleanFormData.state))) {
          const stateName = findNameById(stateOptions, cleanFormData.state);
          if (stateName) cleanFormData.state = stateName;
        }

        if (cleanFormData.city && !isNaN(Number(cleanFormData.city))) {
          const cityName = findNameById(cityOptions, cleanFormData.city);
          if (cityName) cleanFormData.city = cityName;
        }

        if (cleanFormData.university && !isNaN(Number(cleanFormData.university))) {
          const universityName = findNameById(universityOptions, cleanFormData.university);
          if (universityName) cleanFormData.university = universityName;
        }

        if (cleanFormData.collage && !isNaN(Number(cleanFormData.collage))) {
          const collegeNameVal = findNameById(collegeOptions, cleanFormData.collage);
          if (collegeNameVal) cleanFormData.collage = collegeNameVal;
        }

        // Convert stream ID to stream name for edit submissions
        if (cleanFormData.stream && !isNaN(Number(cleanFormData.stream))) {
          const foundStream = streamOptions.find(s => String(s.id) === String(cleanFormData.stream));
          if (foundStream) {
            cleanFormData.stream = foundStream.stream || foundStream.name || cleanFormData.stream;
          }
        }

        if (cleanFormData.staffName && !isNaN(Number(cleanFormData.staffName))) {
          const staffName = findNameById(staffOptions, cleanFormData.staffName);
          if (staffName) cleanFormData.staffName = staffName;
        }
        
        // Remove null/undefined values and convert empty strings to null
        Object.keys(cleanFormData).forEach(key => {
          if (cleanFormData[key] === '' || cleanFormData[key] === undefined) {
            cleanFormData[key] = null;
          }
        });
        
        console.log('Submitting edit data with names:', cleanFormData);
        console.log('Original form data (with IDs):', form);
        await onSubmit(cleanFormData);
        setLoading(false); // Reset loading state
        return; // Exit early as parent handles the rest
      }

      // Original create logic for new inquiries
      if (!form.continent || !form.country || !form.state || !form.city || 
          !form.university || !form.collage || !form.courseName) {
        AlertService.error("Please fill in all required fields");
        setLoading(false);
        return;
      }
      // Get the selected options with their full details
      const [
        selectedContinent,
        selectedCountry,
        selectedState,
        selectedCity,
        selectedUniversity,
        selectedCollege,
        selectedCourse
      ] = await Promise.all([
        continentOptions.find(c => String(c.id) === String(form.continent)) || {},
        countryOptions.find(c => String(c.id) === String(form.country)) || {},
        stateOptions.find(s => String(s.id) === String(form.state)) || {},
        cityOptions.find(c => String(c.id) === String(form.city)) || {},
        universityOptions.find(u => String(u.id) === String(form.university)) || {},
        collegeOptions.find(c => String(c.id) === String(form.collage)) || {},
        courseOptions.find(c => c.courseName === form.courseName) || {}
      ]);
      
      // Stream data is handled in the form state

      // First, validate that all required fields are present
      const requiredFields = [
        { key: 'continent', value: form.continent, name: 'Continent' },
        { key: 'country', value: form.country, name: 'Country' },
        { key: 'state', value: form.state, name: 'State' },
        { key: 'city', value: form.city, name: 'City' },
        { key: 'university', value: form.university, name: 'University' },
        { key: 'collage', value: form.collage, name: 'College' },
        { key: 'courseName', value: form.courseName, name: 'Course' },
        { key: 'stream', value: form.stream, name: 'Stream' }
      ];

      // Check for missing fields
      const missingFields = requiredFields.filter(({ value }) => !value);
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(({ name }) => name).join(', ');
        const errorMessage = `Please select: ${fieldNames}`;
        AlertService.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Convert and validate all IDs
      const ids = {};
      const validationErrors = [];
      
      requiredFields.forEach(({ key, name }) => {
        const value = form[key];
        const numValue = Number(value);
        
        if (isNaN(numValue) || numValue <= 0) {
          validationErrors.push(`${name} has an invalid ID: ${value}`);
        } else {
          ids[`${key}Id`] = numValue;
        }
      });
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // Get display names for location fields with proper null checks
      const continentName = selectedContinent?.continentname || selectedContinent?.name || null;
      const countryName = selectedCountry?.country || selectedCountry?.countryname || selectedCountry?.name || null;
      const stateName = selectedState?.state || selectedState?.stateName || selectedState?.name || null;
      const cityName = selectedCity?.city || selectedCity?.cityName || selectedCity?.name || null;
      const universityName = selectedUniversity?.universityName || selectedUniversity?.university || selectedUniversity?.name || null;
      const collegeName = selectedCollege?.collegeName || selectedCollege?.name || null;
      const courseName = selectedCourse?.courseName || selectedCourse?.name || null;
      
      // Get the selected stream name
      const foundStream = streamOptions.find(s => String(s.id) === form.stream);
      const selectedstream = foundStream ? (foundStream.stream || foundStream.name) : null;
      
      const address = [
        form.houseNo,
        form.street,
        form.landmark,
        cityName || '',
        stateName || '',
        form.pincode
      ].filter(Boolean).join(', ');
      
      const enquiryData = {
        // Contact Information
        name: form.name || null,
        phone_no: form.phone_no ? parseInt(form.phone_no) : null, // Convert to Long for backend
        email: form.email || null,
        gender: form.gender || null,
        dob: form.dob ? new Date(form.dob).toISOString().split('T')[0] : null,
        
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
        college: collegeName || null,
        courseName: courseName || null,
        stream: selectedstream || null,
        
        // Education Information
        passoutCourse: form.passoutCourse || null,
        percentage: form.percentage ? parseFloat(form.percentage) : 0.0,
        passoutYear: form.passoutYear || null,
        gap: form.gap || null,
        gapYear: form.gapYear || null,
        applyFor: form.applyFor || null,
        
        // Family Information
        fathersOccupation: form.fathersOccupation || null,
        fathersIncome: form.fathersIncome ? parseFloat(form.fathersIncome) : 0.0,
        fatherNumber: form.fatherNumber || null,
        fatherITR: form.fatherITR || null,
        yearITR: form.yearITR || null,
        amountITR: form.amountITR || null,
        
        // Additional Fields
        status: form.status || 'pending',
        source: form.source || null,
        remark: form.remark || null,
        loanRequirement: form.loanRequirement || null,
        year: form.year || null,
        amount: form.amount || null,
        hasPassport: form.hasPassport || null,
        passportNo: form.passportNo || null,
        conductBy: form.conductBy || null,
        
        // System Fields
        enquiry_date: new Date().toISOString().split('T')[0],
        createdByEmail: email,
        role: role,
        branchCode: sessionStorage.getItem("branchCode") || "",
      };

      // Create form data with correct structure for the backend
      // Prepare the complete form data with all relationships
      // Note: formData is not used in edit mode as we send JSON directly
      
      // Prepare the data to be sent to the backend
      const submissionData = {
        // Include all form data
        ...enquiryData,
        // Add all IDs with proper naming (both with and without 'Id' suffix for backward compatibility)
        // Note: Using 'collage' (with two 'l's) to match backend expectations
        continent: ids.continentId,
        continentId: ids.continentId,
        country: ids.countryId,
        countryId: ids.countryId,
        state: ids.stateId,
        stateId: ids.stateId,
        city: ids.cityId,
        cityId: ids.cityId,
        university: ids.universityId,
        universityId: ids.universityId,
        college: ids.collegeId,  // Correct spelling 'college'
        collegeId: ids.collegeId,  // Correct spelling 'college'
        courseName: ids.courseId,
        courseId: ids.courseId,
        // Don't include stream in the IDs object as we're sending the name directly
        // Include the photo if it exists
        photo: form.photo,
        conductBy: form.conductBy, // Add Conducted By to submission
        // Add any additional fields that should be in the enquiry
        enquiry_date: new Date().toISOString().split('T')[0],
        createdByEmail: email,
        role: role,
        branchCode: sessionStorage.getItem("branchCode") || ""
      };

      // Log the final submission data for debugging
      console.log('Final submission data:', JSON.stringify(submissionData, null, 2));

      // This block only runs for new inquiries (create mode)
      await createAbroadInquiry(submissionData, email, role);
      AlertService.success("Inquiry created successfully!");
      setForm(initialState);
    } catch (err) {
      console.error("Error creating enquiry:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create inquiry";
      AlertService.error(errorMessage);
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const commonFont = { fontFamily: "Poppins, Helvetica, sans-serif" };

  // Add action buttons for the form
  const renderActionButtons = () => (
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      {isEditMode && onDelete && (
        <Button
          variant="contained"
          color="error"
          onClick={onDelete}
          disabled={isSubmitting || loading}
        >
          Delete
        </Button>
      )}
      <Button
        variant="outlined"
        onClick={onClose}
        disabled={isSubmitting || loading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting || loading}
      >
        {loading || isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update' : 'Submit')}
      </Button>
    </Box>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={0.5} justifyContent="center" className="textField-root">
        {/* Name */}
        <Grid item xs={12} sm={2.4}>
          <TextField 
            label="Name" 
            name="name" 
            value={form.name || ''} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            required 
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Phone No" name="phone_no" value={form.phone_no || ''} onChange={handleChange} fullWidth margin="dense" required disabled={isLoading} />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Email" name="email" value={form.email || ''} onChange={handleChange} fullWidth margin="dense" />
        </Grid>
       
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Status"
            name="status"
            value={form.status || ''}
            onChange={handleChange}
            fullWidth
            margin="dense"
            select
            required
            sx={{
              '& .MuiSelect-select': {
                color:
                  form.status === 'pending'
                    ? 'green'
                    : form.status === 'approved'
                    ? 'red'
                    : form.status === 'connecting'
                    ? 'orange'
                    : form.status === 'ringing'
                    ? 'gold'
                    : form.status === 'callBack'
                    ? 'lightgreen'
                    
                    : form.status === 'office_visit'
                    ? 'purple'
                    : form.status === 'processing'
                    ? 'blue'
                    : form.status === 'application'
                    ? 'maroon'
                    : form.status === 'CNI'
                    ? 'pink'
                    : 'inherit',
                textTransform: 'uppercase',
              },
            }}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem
              value="pending"
              sx={{ color: 'green', textTransform: 'uppercase' }}
            >
              INTERESTED
            </MenuItem>
            <MenuItem
              value="approved"
              sx={{ color: 'red', textTransform: 'uppercase' }}
            >
              NOT INTERESTED
            </MenuItem>
            <MenuItem
              value="connecting"
              sx={{ color: 'orange', textTransform: 'uppercase' }}
            >
              CONNECTING
            </MenuItem>
            <MenuItem
              value="ringing"
              sx={{ color: 'gold', textTransform: 'uppercase' }}
            >
              RINGING / SWITCH OFF
            </MenuItem>
            <MenuItem
              value="callBack"
              sx={{ color: 'lightgreen', textTransform: 'uppercase' }}
            >
              CALL BACK
            </MenuItem>
            <MenuItem
              value="office_visit"
              sx={{ color: 'purple', textTransform: 'uppercase' }}
            >
              Office Visit
            </MenuItem>
            <MenuItem
              value="processing"
              sx={{ color: 'blue', textTransform: 'uppercase' }}
            >
              PROCESSING
            </MenuItem>
            <MenuItem
              value="CNI"
              sx={{ color: 'pink', textTransform: 'uppercase' }}
            >
              CNI
            </MenuItem>
            <MenuItem
              value="application"
              sx={{ color: 'maroon', textTransform: 'uppercase' }}
            >
              APPLICATION
            </MenuItem>
             
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2.4}>
          <TextField label="Gender" name="gender" value={form.gender || ''} onChange={handleChange} fullWidth margin="normal" select>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
        </Grid>
         <Grid item xs={12} sm={2.4}>
          <TextField label="DOB" name="dob" type="date" value={form.dob} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
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

        {form.hasPassport === 'Yes' && (
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
          <TextField label="Passout Course" name="passoutCourse" value={form.passoutCourse} onChange={handleChange} fullWidth margin="normal" select>
            <MenuItem value="">Select</MenuItem>
            {["10th", "12th", "ITI", "Diploma", "BA", "B.Com", "B.Sc", "BBA", "BCA", "MA", "M.Com", "MSc", "PHD", "BE", "B.Tech", "M.Tech", "ME", "Other"].map((courseName) => (
              <MenuItem key={courseName} value={courseName}>{courseName}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Percentage" name="percentage" value={form.percentage} onChange={handleChange} fullWidth margin="normal" />
        </Grid>
       <Grid item xs={12} sm={2.4}>
          <TextField
            label="Passout Year"
            name="passoutYear"
            value={form.passoutYear || ''}
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

        {form.gap === 'Yes' && (
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
              {[1, 2, 3, 4, 5,6,7,8,9,10,11,12,13,14,15].map((year) => (
                <MenuItem key={year} value={year}>
                  {year} {year > 1 ? 'years' : 'year'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
        <Grid item xs={12} sm={2.4}>
          <TextField label="Apply For" name="applyFor" value={form.applyFor} onChange={handleChange} fullWidth margin="normal" select required>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Certificate">Certificate</MenuItem>
            <MenuItem value="Diploma">Diploma</MenuItem>
            <MenuItem value="UG">UG</MenuItem>
            <MenuItem value="PG">PG</MenuItem>
            <MenuItem value="PHD">PHD</MenuItem>
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
            <MenuItem value="">Select College</MenuItem>
            {collegeOptions.map((college) => (
              <MenuItem key={college.id} value={college.id}>
                {college.collegeName || college.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Stream"
            name="stream"
            value={form.stream || ''}
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
                {stream.stream || stream.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Course"
            name="courseName"
            value={form.courseName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
          >
            <MenuItem value="">Select</MenuItem>
            {courseOptions.map((courseName) => (
              <MenuItem key={courseName.id} value={courseName.courseName}>
                {courseName.courseName || courseName.name || 'Unnamed Course'}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="House/Flat No." name="houseNo" value={form.houseNo || ""} onChange={handleChange} fullWidth margin="normal" required />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Street Name" name="street" value={form.street || ""} onChange={handleChange} fullWidth margin="normal" required />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Landmark" name="landmark" value={form.landmark || ""} onChange={handleChange} fullWidth margin="normal" />
        </Grid>

        <Grid item xs={12} sm={2.4}>
          <TextField label="Pincode" name="pincode" value={form.pincode || ""} onChange={handleChange} fullWidth margin="normal" required />
        </Grid>
       {/* Last Row - Occupation, Income, Upload & Submit */}
        <Grid item xs={12} sm={2.4}>
          <TextField label="Father's Occupation" name="fathersOccupation" value={form.fathersOccupation || ""} onChange={handleChange} fullWidth margin="normal" />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Father's Income" name="fathersIncome" value={form.fathersIncome || ""} onChange={handleChange} fullWidth margin="normal" type="number" />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Father's Phone Number" name="fatherNumber" value={form.fatherNumber || ""} onChange={handleChange} fullWidth margin="normal" />
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

        {form.fatherITR === 'Yes' && (
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
          <TextField label="Loan Requirement" name="loanRequirement" value={form.loanRequirement} onChange={(e) => {
              // Reset loan amount and year if requirement is not 'Yes'
              const newValue = e.target.value;
              setForm(prev => ({
                ...prev,
                loanRequirement: newValue,
                ...(newValue !== 'Yes' ? { amount: '', year: '' } : {})
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
        {form.loanRequirement === 'Yes' && (
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
        {/* Source Field */}
        <Grid item xs={12} sm={2.4}>
          <TextField label="Source" name="source" value={form.source} onChange={handleChange} fullWidth margin="normal" select required>
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
            value={form.conductBy}
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
        <Grid item xs={12} sm={2.4}>
          <TextField
            label="Staff"
            name="staffName"
            value={form.staffName || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            select
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (!selected) return 'Select Staff';
                const staff = staffOptions.find(s => s.email === selected);
                return staff ? staff.name : selected;
              }
            }}
          >
            <MenuItem value="">
              <em>Select Staff</em>
            </MenuItem>
            {staffOptions.map((staff) => (
              <MenuItem key={staff.id || staff.email} value={staff.email}>
                {staff.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <TextField label="Remarks" name="remark" value={form.remark} onChange={handleChange} fullWidth margin="normal" />
        </Grid>
        
        <Grid item xs={12} sm={2.4}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12}>
              <Button variant="contained" component="label" fullWidth sx={{ fontFamily: "Poppins", borderRadius: 2 }}>
                Upload Photo
                <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
              </Button>
            </Grid>
            <Grid item xs={12}>
              {form.photo && <Typography variant="body2" sx={{ mt: 1, ...commonFont }}>{form.photo.name}</Typography>}
              <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth sx={{ mt: 1, fontFamily: "Poppins", borderRadius: 2 }}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
              {msg && (
                <Typography sx={{ mt: 1, ...commonFont }} color={msg.includes("success") ? "green" : "red"}>
                  {msg}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {renderActionButtons()}
    </Box>
  );
}
