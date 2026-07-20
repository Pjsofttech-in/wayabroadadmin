import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress, MenuItem, Grid, FormControlLabel, Checkbox, InputAdornment } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAllCourses, createCourse, updateCourse, deleteCourse, getAllStreams, getAllCoursesName } from "./CourseService";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCourse = {
  courseName: "",
  tutionFees: "",
  applicationFees: "",
  description: "",
  date: "",
  duration: "",
  instituteRank: "",
  thumbnail: null,
  intake: "",
  websiteLink: "",
  applicationLink: "",
  academicRequirements: "",
  englishExamRequirements: "",
  examType: "",
  examScore: "",
  location: "",
  city: "",
  additionalRequirements: "",
  scholarship: "",
  hostel: "No",
  hostelFees: "",
  createdByEmail: "",
  role: "",
  courseDetials: "",
  contractType: "",
  streamName: "",
  streamId: null
};

const intakeOptions = ["Any", "Spring", "Fall", "Summer"];
const academicRequirementOptions = ["50%", "55%", "60%", "70%", "80%", "90%"];
const examTypeOptions = ["TOEFL", "IELTS", "DUOLINGO", "GRE", "GMAT", "PTE"];
const yesNoOptions = ["Yes", "No"];

export default function Course({ stream, branchCode, role, email, onBack }) {

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [courseData, setCourseData] = useState(initialCourse);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  // Fetch courses for the current stream/college
  const fetchCourses = async () => {
    if (!stream?.id) {
      message.error('College information is missing');
      return;
    }

    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await getAllCourses({ 
        email, 
        role, 
        streamId: stream.id 
      });
      
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error in fetchCourses:', error);
      message.error(error.response?.data?.message || "Failed to fetch courses");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStreams();
    fetchAvailableCourses();
  }, [search, stream?.id]);

  const fetchStreams = async () => {
    try {
      const data = await getAllStreams();
      setStreams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      message.error('Failed to load streams');
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const data = await getAllCoursesName();
      setAvailableCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      message.error('Failed to load available courses');
    }
  };

  const handleOpenDialog = (record = null) => {
    if (record) {
      setEditing(record.id);
      setCourseData({
        ...record,
        thumbnail: record.thumbnail,
        image: record.image,
        // Map backend fields to frontend state
        courseName: record.courseName || "",
        description: record.description || "",
        tutionFees: record.tutionFees || "",
        applicationFees: record.applicationFees || "",
        duration: record.duration || "",
        intake: record.intake || "Any",
        academicRequirements: record.academicRequirements || "",
        englishExamRequirements: record.englishExamRequirements || "",
        examType: record.examType || "",
        examScore: record.examScore || "",
        location: record.location || "",
        city: record.city || "",
        additionalRequirements: record.additionalRequirements || "",
        scholarship: record.scholarship || "",
        hostel: record.hostel || "No",
        hostelFees: record.hostelFees || "",
        websiteLink: record.websiteLink || "",
        applicationLink: record.applicationLink || "",
        courseDetials: record.courseDetials || "",
        contractType: record.contractType || "",
        streamName: record.streamName || "",
        streamId: record.streamId || null,
        instituteRank: record.instituteRank || ""
      });
      if (record.thumbnail) setThumbnailPreview(record.thumbnail);
      if (record.image) setImagePreview(record.image);
    } else {
      setEditing(null);
      setCourseData({
        ...initialCourse,
        // Ensure streamId is set for new courses
        streamId: stream?.id
      });
      setThumbnailPreview(null);
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCourseData(initialCourse);
    setThumbnailPreview(null);
    setImagePreview(null);
    setEditing(null);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'thumbnail') {
        setCourseData(prev => ({ ...prev, thumbnail: file }));
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (type === 'image') {
        setCourseData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setCourseData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'select-one') {
      setCourseData(prev => ({ ...prev, [name]: value }));
    } else {
      setCourseData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setApiLoading(true);

    try {
      // Get the selected stream
      const selectedStream = streams.find(s => s.id === courseData.streamId);
      
      // Create a clean payload object matching the AbroadCourse entity
      const payload = {
        courseName: courseData.courseName || "",
        description: courseData.description || "",
        tutionFees: courseData.tutionFees ? parseFloat(courseData.tutionFees) : 0,
        applicationFees: courseData.applicationFees ? parseFloat(courseData.applicationFees) : 0,
        duration: courseData.duration || "",
        intake: courseData.intake || "Any",
        academicRequirements: courseData.academicRequirements || "",
        englishExamRequirements: courseData.englishExamRequirements || "",
        instituteRank: courseData.instituteRank || "",
        examType: courseData.examType || "",
        examScore: courseData.examScore || "",
        location: courseData.location || "",
        city: courseData.city || "",
        additionalRequirements: courseData.additionalRequirements || "",
        scholarship: courseData.scholarship || "",
        hostel: courseData.hostel || "No",
        hostelFees: courseData.hostelFees ? parseFloat(courseData.hostelFees) : 0,
        websiteLink: courseData.websiteLink || "",
        applicationLink: courseData.applicationLink || "",
        courseDetials: courseData.courseDetials || "",
        contractType: courseData.contractType || "",
        streamName: selectedStream?.name || courseData.streamName || ""
      };
      
      // Get the collegeId from the stream prop (collegeId is passed as stream.id from parent)
      const collegeId = stream?.id;


      if (editing) {
        await updateCourse(
          editing,
          payload,
          courseData.thumbnail,
          courseData.image,
          role,
          email
        );
        message.success("Course updated successfully");
      } else {
        await createCourse(
          payload,
          courseData.thumbnail,
          courseData.image,
          role,
          email,
          collegeId
        );
        message.success("Course created successfully");
      }
      
      fetchCourses();
      handleCloseDialog();
    } catch (error) {

      message.error(error.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);
    try {
      await deleteCourse(id, role, email);
      message.success("Course deleted");
      fetchCourses();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      title: "Course Name", 
      dataIndex: "courseName", 
      key: "courseName",
      render: text => text || '-',
      width: 150
    },
    { 
      title: "Tution", 
      dataIndex: "tutionFees", 
      key: "tutionFees",
      render: (text, record) => record.tutionFees !== null ? `$${record.tutionFees}` : '-',
      width: 120
    },
    { 
      title: "Application", 
      dataIndex: "applicationFees", 
      key: "applicationFees",
      render: (text, record) => record.applicationFees !== null ? `$${record.applicationFees}` : '-',
      width: 140
    },
    { 
      title: "Date", 
      dataIndex: "date", 
      key: "date",
      render: (text, record) => record.date || '-',
      width: 120
    },
    { 
      title: "Institute Rank", 
      dataIndex: "instituteRank", 
      key: "instituteRank",
      render: (text, record) => record.instituteRank || '-',
      width: 120
    },
    { 
      title: "Intake", 
      dataIndex: "intake", 
      key: "intake",
      render: (text, record) => record.intake || '-',
      width: 100
    },
    { 
      title: "University", 
      dataIndex: "websiteLink", 
      key: "websiteLink",
      render: (text, record) => record.websiteLink ? (
        <a 
          href={record.websiteLink.startsWith('http') ? record.websiteLink : `https://${record.websiteLink}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ whiteSpace: 'nowrap' }}
          title="Visit University Website"
        >
          University
        </a>
      ) : '-',
      width: 120
    },
    { 
      title: "Application", 
      dataIndex: "applicationLink", 
      key: "applicationLink",
      render: (text, record) => record.applicationLink ? (
        <a 
          href={record.applicationLink.startsWith('http') ? record.applicationLink : `https://${record.applicationLink}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ whiteSpace: 'nowrap' }}
          title="Go to Application"
        >
          Apply Now
        </a>
      ) : '-',
      width: 120
    },
    { 
      title: "Academic", 
      dataIndex: "academicRequirements", 
      key: "academicRequirements",
      render: (text, record) => record.academicRequirements || '-',
      width: 120
    },
    { 
      title: "English", 
      dataIndex: "englishExamRequirements", 
      key: "englishExamRequirements",
      render: (text, record) => record.englishExamRequirements || 'No',
      width: 100
    },
    { 
      title: "Score", 
      dataIndex: "examScore", 
      key: "examScore",
      render: (text, record) => record.examScore || '-',
      width: 100
    },
    { 
      title: "State", 
      dataIndex: "city", 
      key: "city",
      render: (text, record) => record.city || '-',
      width: 100
    },
    { 
      title: "City", 
      dataIndex: "location", 
      key: "location",
      render: (text, record) => record.location || '-',
      width: 100
    },
    { 
      title: "Duration", 
      dataIndex: "duration", 
      key: "duration",
      render: (text, record) => record.duration ? `${record.duration} ${record.duration === '1' ? 'Year' : 'Years'}` : '-',
      width: 100
    },
    { 
      title: "Description", 
      dataIndex: "description", 
      key: "description",
      render: (text, record) => record.description ? (record.description.length > 30 ? `${record.description.substring(0, 30)}...` : record.description) : '-',
      width: 200
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (url) =>
        url ? <img src={url} alt="thumbnail" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "No Image",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (url) =>
        url ? <img src={url} alt="course" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "No Image",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Stack direction="row" spacing={1}>
          {/* <IconButton onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton> */}
          <Popconfirm title="Delete this course?" onConfirm={() => handleDelete(record.id)}>
            <IconButton><DeleteOutlined /></IconButton>
          </Popconfirm>
        </Stack>
      ),
    },
  ];

  return (
    <div>
      <LoadingOverlay loading={apiLoading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ flexShrink: 0 }}
        >
          Back to College
        </Button>
        <Input.Search
          placeholder="Search courses"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
          sx={{ ml: 2 }}
        >
          Add Course
        </Button>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Update Course" : "Add Course"}</DialogTitle>
        <DialogContent>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              {/* Row 1: Stream and Course Information */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Stream Name"
                  name="streamName"
                  value={courseData.streamId || ''}
                  onChange={(e) => {
                    const selectedStream = streams.find(s => s.id === e.target.value);
                    if (selectedStream) {
                      setCourseData(prev => ({
                        ...prev,
                        streamId: selectedStream.id,
                        streamName: selectedStream.name
                      }));
                    }
                  }}
                  fullWidth
                  margin="normal"
                  required
                  disabled={!!editing}
                >
                  <MenuItem value=""><em>Select Stream</em></MenuItem>
                  {streams.map((streamItem) => (
                    <MenuItem key={streamItem.id} value={streamItem.id}>
                      {streamItem.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Course Name"
                  name="courseName"
                  value={courseData.courseName || ''}
                  onChange={(e) => {
                    const selectedCourse = availableCourses.find(c => c.courseName === e.target.value);
                    if (selectedCourse) {
                      setCourseData(prev => ({
                        ...prev,
                        courseName: selectedCourse.courseName,
                        courseId: selectedCourse.id
                      }));
                    } else {
                      setCourseData(prev => ({
                        ...prev,
                        courseName: e.target.value,
                        courseId: null
                      }));
                    }
                  }}
                  fullWidth
                  margin="normal"
                  required
                >
                  <MenuItem value=""><em>Select Course</em></MenuItem>
                  {availableCourses.map((course) => (
                    <MenuItem key={course.id} value={course.courseName}>
                      {course.courseName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Tution Fees"
                  name="tutionFees"
                  value={courseData.tutionFees}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Application Fees"
                  name="applicationFees"
                  value={courseData.applicationFees}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Row 2: Duration and Intake */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Duration"
                  name="duration"
                  value={courseData.duration || ""}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value=""><em>Select Duration</em></MenuItem>
                  <MenuItem value="1">1 Year</MenuItem>
                  <MenuItem value="1.5">1.5 Years</MenuItem>
                  <MenuItem value="2">2 Years</MenuItem>
                  <MenuItem value="2.5">2.5 Years</MenuItem>
                  <MenuItem value="3">3 Years</MenuItem>
                  <MenuItem value="3.5">3.5 Years</MenuItem>
                  <MenuItem value="4">4 Years</MenuItem>
                  <MenuItem value="4.5">4.5 Years</MenuItem>
                  <MenuItem value="5">5 Years</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Intake"
                  name="intake"
                  value={courseData.intake || ""}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value=""><em>Select Intake</em></MenuItem>
                  {intakeOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="University Website Link"
                  name="websiteLink"
                  value={courseData.websiteLink}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  type="url"
                  placeholder="https://university.edu"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Application Link"
                  name="applicationLink"
                  value={courseData.applicationLink}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  type="url"
                  placeholder="https://apply.university.edu"
                />
              </Grid>

              {/* Row 3: Academic Requirements */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Academic Requirements"
                  name="academicRequirements"
                  value={courseData.academicRequirements || ""}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value=""><em>Select Academic Requirements</em></MenuItem>
                  {academicRequirementOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Institute Rank (World)"
                  name="instituteRank"
                  value={courseData.instituteRank}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="University Rank"
                  name="city"
                  value={courseData.city || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  placeholder="Enter university rank"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="State Rank"
                  name="location"
                  value={courseData.location || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  placeholder="Enter state rank"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Hostel Available"
                  name="hostel"
                  value={courseData.hostel || 'No'}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                >
                  {yesNoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Row 4: Conditional Fields */}
              {courseData.hostel === 'Yes' && (
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Hostel Fees (Per Year)"
                    name="hostelFees"
                    value={courseData.hostelFees || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="English Exam Required"
                  name="englishExamRequirements"
                  value={courseData.englishExamRequirements || 'No'}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                >
                  {yesNoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {courseData.englishExamRequirements === 'Yes' && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      select
                      label="Exam Type"
                      name="examType"
                      value={courseData.examType || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                    >
                      {examTypeOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Exam Score"
                      name="examScore"
                      value={courseData.examScore || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      type="number"
                    />
                  </Grid>
                </>
              )}

              {/* Location fields moved up after institute rank */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Scholarship Available"
                  name="scholarship"
                  value={courseData.scholarship || 'No'}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                >
                  {yesNoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Row 6: Scholarship Details */}
              {courseData.scholarship === 'Yes' && (
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Scholarship Details"
                    name="scholarship"
                    value={courseData.scholarship || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              )}

              {/* Row 7: Text Areas */}
              <Grid item xs={12}>
                <TextField
                  label="Course Details (Description)"
                  name="description"
                  value={courseData.description}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Additional Requirements"
                  name="additionalRequirements"
                  value={courseData.additionalRequirements}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Row 8: File Uploads */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Uploads</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button variant="contained" component="label" fullWidth>
                  {courseData.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                  <input type="file" name="thumbnail" accept="image/*" hidden onChange={handleChange} />
                </Button>
                {courseData.thumbnail && (
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {typeof courseData.thumbnail === 'string' ? 'Current thumbnail' : courseData.thumbnail.name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Button variant="outlined" component="label" fullWidth>
                  {courseData.image ? 'Change Image' : 'Upload Image'}
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    hidden 
                    onChange={handleChange} 
                  />
                </Button>
                {courseData.image && (
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {typeof courseData.image === 'string' ? 'Current image' : courseData.image.name}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <div style={{ overflowX: 'auto' }}>
        <Table
          columns={columns}
          dataSource={courses}
          rowKey="id"
          loading={tableLoading}
          pagination={{ pageSize: 8 }}
          style={{ marginTop: 24, minWidth: '1200px' }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}
