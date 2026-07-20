import React, { useState, useEffect } from "react";
import { Input, Select } from "antd";

const { Option } = Select;

const ScholarshipFilters = ({
  onFilter,
  totalCount,
  studyLocations,
  scholarshipForList,
  scholarshipTypes,
  categories,
}) => {
  const [filters, setFilters] = useState({
    searchText: "",       // name/location search
    studyLocation: "",    // location dropdown
    scholarshipFor: "",
    scholarshipType: "",
    category: "",
    applyMonth: "",
  });

  // ✅ Call onFilter whenever filters change
  useEffect(() => {
    onFilter(filters);
  }, [filters]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    const resetFilters = {
      searchText: "",
      studyLocation: "",
      scholarshipFor: "",
      scholarshipType: "",
      category: "",
      applyMonth: "",
    };
    setFilters(resetFilters);
  };

  return (
    <div style={{ width: "100%", marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* Search by Name + Location */}
        <Input
          placeholder="Search Name or Location"
          value={filters.searchText}
          onChange={(e) => handleChange("searchText", e.target.value)}
          style={{ width: 180, height: 32 }}
          allowClear
        />

        {/* Location Dropdown */}
        <Select
          placeholder="Location"
          value={filters.studyLocation || undefined}
          onChange={(value) => handleChange("studyLocation", value)}
          style={{ width: 140, height: 32 }}
          allowClear
        >
          {studyLocations?.map((loc) => (
            <Option key={loc} value={loc}>
              {loc}
            </Option>
          ))}
        </Select>

        {/* Scholarship For */}
        <Select
          placeholder="Scholarship For"
          value={filters.scholarshipFor || undefined}
          onChange={(value) => handleChange("scholarshipFor", value)}
          style={{ width: 140, height: 32 }}
          allowClear
        >
          {scholarshipForList?.map((item) => (
            <Option key={item} value={item}>
              {item}
            </Option>
          ))}
        </Select>

        {/* Scholarship Type */}
        <Select
          placeholder="Type"
          value={filters.scholarshipType || undefined}
          onChange={(value) => handleChange("scholarshipType", value)}
          style={{ width: 140, height: 32 }}
          allowClear
        >
          {scholarshipTypes?.map((item) => (
            <Option key={item} value={item}>
              {item}
            </Option>
          ))}
        </Select>

        {/* Category */}
        <Select
          placeholder="Category"
          value={filters.category || undefined}
          onChange={(value) => handleChange("category", value)}
          style={{ width: 140, height: 32 }}
          allowClear
        >
          {categories?.map((item) => (
            <Option key={item} value={item}>
              {item}
            </Option>
          ))}
        </Select>

        {/* Apply Month */}
        <Input
          placeholder="Apply Month"
          value={filters.applyMonth}
          onChange={(e) => handleChange("applyMonth", e.target.value)}
          style={{ width: 120, height: 32 }}
          allowClear
        />

        {/* Reset Button */}
        <div
          onClick={handleReset}
          style={{
            cursor: "pointer",
            color: "#1890ff",
            fontWeight: "bold",
            height: 32,
            lineHeight: "32px",
            padding: "0 10px",
            border: "1px solid #1890ff",
            borderRadius: 4,
          }}
        >
          Reset
        </div>

        {/* Total Count */}
        <div style={{ fontWeight: "bold", marginLeft: "auto" }}>
          Total Scholarships: {totalCount}
        </div>
      </div>
    </div>
  );
};

export default ScholarshipFilters;
