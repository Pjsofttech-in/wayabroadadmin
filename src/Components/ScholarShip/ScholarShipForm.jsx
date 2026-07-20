import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Editor } from "@tinymce/tinymce-react";

import AlertService from "../Common/AlertService"; 


import {
  getAllStudyLocation,
  getAllScholarshipFor,
  getAllScholarshipTypes,
  getAllScholarshipCategories,
} from "./SettingDropdownServices";

import { createScholarship } from "./ScholarShipServices";

const ScholarshipForm = () => {
  const [formData, setFormData] = useState({
    sname: "",
    studyLocation: "",
    scholarshipFor: "",
    scholarshipType: "",
    scholarshipcategory: "",
    applyMonth: "",
    testDate: "",
    testResult: "",
    deadline: "",
    eligibility: "",
    specialRequirement: "",
    benefits: "",
    description: "",
    examDetails: "",
    amount: "",
    qualification: "",
    link: "",
    branchCode: "",
  });

  const [studyLocations, setStudyLocations] = useState([]);
  const [scholarshipForList, setScholarshipForList] = useState([]);
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [logo, setLogo] = useState("");
  const [pdf, setPdf] = useState("");

  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyMonthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);

        const studyLocRes = await getAllStudyLocation();
        const scholarshipForRes = await getAllScholarshipFor();
        const scholarshipTypeRes = await getAllScholarshipTypes();
        const categoryRes = await getAllScholarshipCategories();

        setStudyLocations(studyLocRes || []);
        setScholarshipForList(scholarshipForRes || []);
        setScholarshipTypes(scholarshipTypeRes || []);
        setCategories(categoryRes || []);
      } catch (error) {
        console.error("Dropdown Fetch Error:", error);
        AlertService.error("Failed to load dropdown data from settings");
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // FAQ handlers
  const handleFaqChange = (index, field, value) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][field] = value;
    setFaqs(updatedFaqs);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
  };

  // Convert Logo to Base64
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Convert PDF to Base64
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPdf(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        category: formData.scholarshipcategory,
        scholarshipcategory: formData.scholarshipcategory,
        amount: formData.amount ? Number(formData.amount) : 0,
        logo: logo || "",
        pdf: pdf || "",
        faq: JSON.stringify(faqs),
        deadline: formData.deadline ? formData.deadline : null,
        branchCode: sessionStorage.getItem("branchCode") || formData.branchCode,
      };

      console.log("Sending Payload:", payload);

      await createScholarship(payload);

      AlertService.success("Scholarship Created Successfully!");

      setFormData({
        sname: "",
        studyLocation: "",
        scholarshipFor: "",
        scholarshipType: "",
        scholarshipcategory: "",
        applyMonth: "",
        testDate: "",
        testResult: "",
        deadline: "",
        eligibility: "",
        specialRequirement: "",
        benefits: "",
        description: "",
        examDetails: "",
        amount: "",
        qualification: "",
        link: "",
        branchCode: "",
      });

      setFaqs([{ question: "", answer: "" }]);
      setLogo("");
      setPdf("");
    } catch (error) {
      console.error("Create Scholarship Error:", error);

      if (error.response) {
        AlertService.error("Backend Error: " + JSON.stringify(error.response.data));
      } else {
        AlertService.error("Failed to create scholarship");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: "200px" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: "15px" }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* ===== ROW 1 (5 items) ===== */}
            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                fullWidth
                label="Scholarship Name"
                name="sname"
                value={formData.sname}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                select
                fullWidth
                label="Study Location"
                name="studyLocation"
                value={formData.studyLocation}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Study Location
                </MenuItem>
                {studyLocations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                select
                fullWidth
                label="Scholarship For"
                name="scholarshipFor"
                value={formData.scholarshipFor}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Scholarship For
                </MenuItem>
                {scholarshipForList.map((item) => (
                  <MenuItem key={item.id} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                fullWidth
                label="Qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
              />
            </Grid>

            {/* Branch Code */}
            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                fullWidth
                label="Branch Code"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* ===== ROW 2 (5 items) ===== */}
            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                select
                fullWidth
                label="Scholarship Type"
                name="scholarshipType"
                value={formData.scholarshipType}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Scholarship Type
                </MenuItem>
                {scholarshipTypes.map((item) => (
                  <MenuItem key={item.id} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                select
                fullWidth
                label="Category"
                name="scholarshipcategory"
                value={formData.scholarshipcategory}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Category
                </MenuItem>
                {categories.map((item) => (
                  <MenuItem key={item.id} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                select
                fullWidth
                label="Apply Month"
                name="applyMonth"
                value={formData.applyMonth}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Apply Month
                </MenuItem>
                {applyMonthOptions.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                size="small"
                fullWidth
                label="Scholarship Link"
                name="link"
                value={formData.link}
                onChange={handleChange}
              />
            </Grid>

            {/* ===== ROW 3 (3 items only) ===== */}
            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Test Date"
                name="testDate"
                value={formData.testDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                select
                fullWidth
                label="Test Result"
                name="testResult"
                value={formData.testResult}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Test Result Month
                </MenuItem>
                {applyMonthOptions.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* ===== OTHER FIELDS (same size) ===== */}
            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                fullWidth
                label="Eligibility"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                multiline
                rows={2}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                fullWidth
                label="Benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                fullWidth
                label="Special Requirement"
                name="specialRequirement"
                value={formData.specialRequirement}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                fullWidth
                label="Exam Details"
                name="examDetails"
                value={formData.examDetails}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            {/* ===== DESCRIPTION BIGGER ===== */}
            <Grid item xs={12}>
  <Typography sx={{ fontWeight: "bold", mb: 1 }}>
    Description
  </Typography>

  <Editor
    apiKey="4kk710ipyvfsq6vkw2xb192rertkz2jug0nutw35qgxhpy4j"
    value={formData.description}
    onEditorChange={(content) =>
      setFormData((prev) => ({
        ...prev,
        description: content,
      }))
    }
    init={{
      height: 500,
      menubar: true,
      plugins: [
        "advlist",
        "autolink",
        "lists",
        "link",
        "image",
        "charmap",
        "preview",
        "anchor",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "insertdatetime",
        "media",
        "table",
        "paste",
        "help",
        "wordcount",
      ],
      toolbar:
        "undo redo | formatselect | " +
        "bold italic backcolor | alignleft aligncenter " +
        "alignright alignjustify | bullist numlist outdent indent | " +
        "removeformat | help",
      content_style:
        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
    }}
  />
</Grid>

            {/* ===== FILE UPLOAD (moved down) ===== */}
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Upload Logo
              </Typography>
              <TextField
                size="small"
                fullWidth
                type="file"
                inputProps={{ accept: "image/*" }}
                onChange={handleLogoChange}
                helperText=" "
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Upload PDF
              </Typography>
              <TextField
                size="small"
                fullWidth
                type="file"
                inputProps={{ accept: "application/pdf" }}
                onChange={handlePdfChange}
                helperText=" "
              />
            </Grid>

            {/* FAQ */}
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  FAQ's
                </Typography>

                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addFaq}
                >
                  Add FAQ
                </Button>
              </Box>
            </Grid>

            {faqs.map((faq, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 2, borderRadius: "12px", mt: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        size="small"
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={faq.question}
                        onChange={(e) =>
                          handleFaqChange(index, "question", e.target.value)
                        }
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        size="small"
                        fullWidth
                        label={`Answer ${index + 1}`}
                        value={faq.answer}
                        onChange={(e) =>
                          handleFaqChange(index, "answer", e.target.value)
                        }
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={1} sx={{ textAlign: "center" }}>
                      {faqs.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removeFaq(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="contained"
              type="submit"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
            >
              {isSubmitting ? "Saving..." : "Save Scholarship"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ScholarshipForm;
