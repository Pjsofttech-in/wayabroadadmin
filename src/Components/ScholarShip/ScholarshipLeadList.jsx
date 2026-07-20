import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Select,
  MenuItem,
  Button,
  Modal,
} from "@mui/material";
import TablePagination from "@mui/material/TablePagination";
import LoadingOverlay from "../Common/LoadingOverlay";
import AlertService from "../Common/AlertService";
import "../Common/Design.css";

import {
  getAllScholarshipLeads,
  updateScholarshipLead,
} from "./ScholarShipServices";

// Dropdown APIs
import {
  getAllStudyLocation,
  getAllScholarshipFor,
} from "./SettingDropdownServices";

const ScholarshipLeadList = () => {
  const [leadList, setLeadList] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dropdowns
  const [studyLocations, setStudyLocations] = useState([]);
  const [scholarshipForList, setScholarshipForList] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [filterScholarship, setFilterScholarship] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterRemark, setFilterRemark] = useState("");

  // Status dropdown (saved local)
  const [adminRemarks, setAdminRemarks] = useState({});
  const [remarkEditingId, setRemarkEditingId] = useState(null);

  // NEW Remark TextField
  const [textRemarks, setTextRemarks] = useState({});
  const [textEditingId, setTextEditingId] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Status Options
  const remarkOptions = [
    "INTERESTED",
    "NOT INTERESTED",
    "CONNECTING",
    "RINGING",
    "CALL BACK",
    "OFFICE VISIT",
    "PROCESSING",
    "APPLICATION",
    "CNI",
  ];

  const getRemarkColor = (remark) => {
    switch (remark) {
      case "INTERESTED":
        return "green";
      case "NOT INTERESTED":
        return "red";
      case "CONNECTING":
        return "orange";
      case "RINGING":
        return "gold";
      case "CALL BACK":
        return "#90ee90";
      case "OFFICE VISIT":
        return "violet";
      case "PROCESSING":
        return "blue";
      case "APPLICATION":
        return "#5c4033";
      case "CNI":
        return "#ffcc99";
      default:
        return "gray";
    }
  };

  // ================= FETCH DROPDOWN DATA =================
  const fetchDropdownData = async () => {
    try {
      const locations = await getAllStudyLocation();
      const scholarships = await getAllScholarshipFor();
      setStudyLocations(locations || []);
      setScholarshipForList(scholarships || []);
    } catch (error) {
      console.error("Dropdown fetch error:", error);
      AlertService.error("Failed to fetch dropdown data!");
    }
  };

  // ================= FETCH LEADS =================
  const fetchLeadList = async () => {
    setLoading(true);
    try {
      const data = await getAllScholarshipLeads();
      setLeadList(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error(error);
      AlertService.error("Failed to fetch Scholarship Leads!");
    } finally {
      setLoading(false);
    }
  };

  // Load local Status
  useEffect(() => {
    const savedStatus = JSON.parse(localStorage.getItem("adminRemarks")) || {};
    setAdminRemarks(savedStatus);

    const savedTextRemarks =
      JSON.parse(localStorage.getItem("leadTextRemarks")) || {};
    setTextRemarks(savedTextRemarks);
  }, []);

  useEffect(() => {
    fetchDropdownData();
    fetchLeadList();
  }, []);

  // ================= FILTERING =================
  useEffect(() => {
    let temp = [...leadList];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      temp = temp.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.location?.toLowerCase().includes(term)
      );
    }

    if (filterScholarship) {
      temp = temp.filter(
        (lead) =>
          lead.scholarship?.toLowerCase() === filterScholarship.toLowerCase()
      );
    }

    if (filterLocation) {
      temp = temp.filter(
        (lead) =>
          lead.location?.toLowerCase() === filterLocation.toLowerCase()
      );
    }

    if (filterRemark) {
      temp = temp.filter(
        (lead) => adminRemarks[lead.id]?.toUpperCase() === filterRemark
      );
    }

    setFilteredLeads(temp);
    setPage(0);
  }, [
    searchTerm,
    filterScholarship,
    filterLocation,
    filterRemark,
    leadList,
    adminRemarks,
  ]);

  // ================= STATUS HANDLER =================
  const handleStatusChange = (leadId, value) => {
    const updated = { ...adminRemarks, [leadId]: value };
    setAdminRemarks(updated);
    localStorage.setItem("adminRemarks", JSON.stringify(updated));
    setRemarkEditingId(null);
  };

  // ================= TEXT REMARK HANDLER =================
  const saveTextRemark = (leadId, value) => {
    const updated = { ...textRemarks, [leadId]: value };
    setTextRemarks(updated);
    localStorage.setItem("leadTextRemarks", JSON.stringify(updated));
    setTextEditingId(null);
  };

  // ================= MODAL HANDLERS =================
  const openEditModal = (lead) => {
    setSelectedLead({ ...lead });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
  };

  const handleModalChange = (field, value) => {
    setSelectedLead((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateLead = async () => {
    if (!selectedLead?.id) return;

    setLoading(true);
    try {
      await updateScholarshipLead(selectedLead.id, selectedLead);

      const updatedList = leadList.map((lead) =>
        lead.id === selectedLead.id ? { ...lead, ...selectedLead } : lead
      );

      setLeadList(updatedList);
      setFilteredLeads(updatedList);

      AlertService.success("Lead updated successfully!");
      closeModal();
    } catch (error) {
      console.error(error);
      AlertService.error("Failed to update lead!");
    } finally {
      setLoading(false);
    }
  };

  // ================= PAGINATION =================
  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterScholarship("");
    setFilterLocation("");
    setFilterRemark("");
    setPage(0);
  };

  const scholarshipOptions = [
    ...new Set(leadList.map((l) => l.scholarship).filter(Boolean)),
  ];

  const locationOptions = [
    ...new Set(leadList.map((l) => l.location).filter(Boolean)),
  ];

  // ================= RENDER =================
  return (
    <div style={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      <Paper sx={{ p: 4, borderRadius: "12px" }}>
        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
            mb: 3,
          }}
        >
          <TextField
            size="small"
            label="Search Name / Email / Location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 220 }}
          />

          <Select
            size="small"
            value={filterScholarship}
            onChange={(e) => setFilterScholarship(e.target.value)}
            displayEmpty
            sx={{ width: 160 }}
          >
            <MenuItem value="">All Scholarships</MenuItem>
            {scholarshipOptions.map((sch) => (
              <MenuItem key={sch} value={sch}>
                {sch}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            displayEmpty
            sx={{ width: 160 }}
          >
            <MenuItem value="">All Locations</MenuItem>
            {locationOptions.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={filterRemark}
            onChange={(e) => setFilterRemark(e.target.value)}
            displayEmpty
            sx={{ width: 160 }}
          >
            <MenuItem value="">All Status</MenuItem>
            {remarkOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>

          <Button size="small" variant="outlined" onClick={handleResetFilters}>
            Reset
          </Button>

          <Typography sx={{ fontWeight: "bold", ml: "auto" }}>
            Total Leads: {filteredLeads.length}
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr No</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Scholarship For</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remark</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredLeads.length > 0 ? (
                filteredLeads
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      sx={{ cursor: "pointer" }}
                      onClick={() => openEditModal(lead)}
                    >
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.phoneno}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.location}</TableCell>
                      <TableCell>{lead.scholarship}</TableCell>
                      <TableCell>
                        {lead.createdDate
                          ? new Date(lead.createdDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>

                      {/* ✅ STATUS Dropdown Editable */}
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          color: getRemarkColor(adminRemarks[lead.id]),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemarkEditingId(lead.id);
                        }}
                      >
                        {remarkEditingId === lead.id ? (
                          <Select
                            size="small"
                            value={adminRemarks[lead.id] || ""}
                            onChange={(e) =>
                              handleStatusChange(lead.id, e.target.value)
                            }
                            autoFocus
                            fullWidth
                          >
                            {remarkOptions.map((r) => (
                              <MenuItem
                                key={r}
                                value={r}
                                sx={{ color: getRemarkColor(r) }}
                              >
                                {r}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : (
                          adminRemarks[lead.id] || "CLICK TO SELECT"
                        )}
                      </TableCell>

                      {/* ✅ REMARK TextField Editable */}
                      <TableCell
                        sx={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTextEditingId(lead.id);
                        }}
                      >
                        {textEditingId === lead.id ? (
                          <TextField
                            size="small"
                            fullWidth
                            autoFocus
                            value={textRemarks[lead.id] || ""}
                            placeholder="Type remark..."
                            onChange={(e) =>
                              setTextRemarks((prev) => ({
                                ...prev,
                                [lead.id]: e.target.value,
                              }))
                            }
                            onBlur={(e) =>
                              saveTextRemark(lead.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveTextRemark(lead.id, e.target.value);
                              }
                            }}
                          />
                        ) : (
                          <span style={{ color: textRemarks[lead.id] ? "black" : "gray" }}>
                            {textRemarks[lead.id] || "Click to type"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No Leads Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <TablePagination
            component="div"
            count={filteredLeads.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </Box>
      </Paper>

      {/* Modal */}
      <Modal open={isModalOpen} onClose={closeModal}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            p: 4,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Lead
          </Typography>

          {selectedLead && (
            <>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedLead.name || ""}
                  onChange={(e) => handleModalChange("name", e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Mobile No"
                  value={selectedLead.phoneno || ""}
                  onChange={(e) => handleModalChange("phoneno", e.target.value)}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedLead.email || ""}
                  onChange={(e) => handleModalChange("email", e.target.value)}
                />

                <Select
                  fullWidth
                  value={selectedLead.location || ""}
                  onChange={(e) => handleModalChange("location", e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Select Location</MenuItem>
                  {studyLocations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Select
                  fullWidth
                  value={selectedLead.scholarship || ""}
                  onChange={(e) =>
                    handleModalChange("scholarship", e.target.value)
                  }
                  displayEmpty
                >
                  <MenuItem value="">Select Scholarship For</MenuItem>
                  {scholarshipForList.map((s) => (
                    <MenuItem key={s.id} value={s.name}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={closeModal}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdateLead}>
                  Update
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Modal>
    </div>
  );
};

export default ScholarshipLeadList;
