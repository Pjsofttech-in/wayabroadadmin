import React, { useEffect, useState } from "react";
import { Table, Modal, Form, Input, Button, Select, DatePicker } from "antd";
import { getAllScholarships, updateScholarship } from "./ScholarShipServices";

import AlertService from "../Common/AlertService";
import LoadingOverlay from "../Common/LoadingOverlay";
import ScholarshipFilters from "./ScholarshipFilters";
import { Tooltip } from "antd";

import dayjs from "dayjs";

// ✅ Dropdown APIs
import {
  getAllStudyLocation,
  getAllScholarshipFor,
  getAllScholarshipTypes,
  getAllScholarshipCategories,
} from "./SettingDropdownServices";

const { Option } = Select;
const { TextArea } = Input;

const ScholarshipList = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [form] = Form.useForm();

  // dropdown values
  const [studyLocations, setStudyLocations] = useState([]);
  const [scholarshipForList, setScholarshipForList] = useState([]);
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [categories, setCategories] = useState([]);

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

  // ================= FETCH DROPDOWN DATA =================
  const fetchDropdownData = async () => {
    try {
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
      AlertService.error("Failed to load dropdown data!");
    }
  };

  // ================= FETCH SCHOLARSHIP DATA =================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllScholarships();
      const list = Array.isArray(res) ? res : [];

      setData(list);
      setFilteredData(list);
    } catch (error) {
      console.error(error);
      AlertService.error("Failed to fetch scholarships!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDropdownData();
  }, []);

  // ================= FILTER HANDLER =================
  const handleFilter = (filters) => {
    let temp = [...data];

    // ✅ Combined Search: Name + Location + Category
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.sname?.toLowerCase().includes(search) ||
          item.studyLocation?.toLowerCase().includes(search) ||
          item.scholarshipcategory?.toLowerCase().includes(search)
      );
    }

    if (filters.scholarshipFor) {
      temp = temp.filter(
        (item) => item.scholarshipFor === filters.scholarshipFor
      );
    }

    if (filters.scholarshipType) {
      temp = temp.filter(
        (item) => item.scholarshipType === filters.scholarshipType
      );
    }

    if (filters.category) {
      temp = temp.filter(
        (item) => item.scholarshipcategory === filters.category
      );
    }

    if (filters.applyMonth) {
      temp = temp.filter((item) =>
        item.applyMonth
          ?.toLowerCase()
          .includes(filters.applyMonth.toLowerCase())
      );
    }

    setFilteredData(temp);
  };

  // ================= OPEN MODAL =================
  const openEditModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);

    form.setFieldsValue({
      sname: record.sname,
      studyLocation: record.studyLocation,
      scholarshipFor: record.scholarshipFor,
      scholarshipType: record.scholarshipType,
      scholarshipcategory: record.scholarshipcategory,
      applyMonth: record.applyMonth,
      deadline: record.deadline ? dayjs(record.deadline) : null,
      amount: record.amount,
      description: record.description || "",
    });
  };

  // ================= CLOSE MODAL =================
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  // ================= UPDATE SCHOLARSHIP =================
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...selectedRecord,
        ...values,
        deadline: values.deadline ? values.deadline.format("YYYY-MM-DD") : null,
      };

      await updateScholarship(selectedRecord.id, payload);

      const updatedList = data.map((item) =>
        item.id === selectedRecord.id ? payload : item
      );

      setData(updatedList);
      setFilteredData(updatedList);

      AlertService.success("Updated Successfully!");
      closeModal();
    } catch (error) {
      console.error("Update error:", error);
      AlertService.error("Update Failed!");
    } finally {
      setLoading(false);
    }
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      title: "Sr No",
      key: "srNo",
      width: 80,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Scholarship Name",
      dataIndex: "sname",
      key: "sname",
      render: (text, record) => (
        <span
          style={{ cursor: "pointer", fontWeight: 500 }}
          onClick={() => openEditModal(record)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Study Location",
      dataIndex: "studyLocation",
      key: "studyLocation",
    },
    {
      title: "Scholarship For",
      dataIndex: "scholarshipFor",
      key: "scholarshipFor",
    },
    {
      title: "Scholarship Type",
      dataIndex: "scholarshipType",
      key: "scholarshipType",
    },
    {
      title: "Category",
      dataIndex: "scholarshipcategory",
      key: "scholarshipcategory",
    },
    {
      title: "Apply Month",
      dataIndex: "applyMonth",
      key: "applyMonth",
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
  title: "Description",
  dataIndex: "description",
  key: "description",
  render: (text) => (
    <Tooltip title={text}>
      <div
        style={{
          maxWidth: "100px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
        }}
      >
        {text}
      </div>
    </Tooltip>
  ),
},

  ];

  return (
    <div style={{ padding: 20, position: "relative" }}>
      <LoadingOverlay loading={loading} />

      {/* FILTER COMPONENT */}
      <ScholarshipFilters
        onFilter={handleFilter}
        totalCount={filteredData.length}
        studyLocations={studyLocations.map((x) => x.name)}
        scholarshipForList={scholarshipForList.map((x) => x.name)}
        scholarshipTypes={scholarshipTypes.map((x) => x.name)}
        categories={categories.map((x) => x.name)}
      />

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          defaultPageSize: 25,
          pageSizeOptions: ["25", "50", "100"],
          showSizeChanger: true,
          position: ["bottomRight"],
        }}
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          onClick: () => openEditModal(record),
        })}
      />

      {/* MODAL */}
      <Modal
  title="Update Scholarship"
  open={isModalOpen}
  onCancel={closeModal}
  footer={null}
  width={1000}
  style={{ top: 80, left: 80 }}   // ✅ move modal right + down
>
  <Form layout="vertical" form={form}>
    
    {/* ROW 1 (4 fields) */}
    <div style={{ display: "flex", gap: "15px" }}>
      <div style={{ flex: 1 }}>
        <Form.Item
          label="Scholarship Name"
          name="sname"
          rules={[{ required: true, message: "Scholarship Name is required" }]}
        >
          <Input placeholder="Enter Scholarship Name" />
        </Form.Item>
      </div>

      <div style={{ flex: 1 }}>
        <Form.Item label="Study Location" name="studyLocation">
          <Select placeholder="Select Study Location" allowClear>
            {studyLocations.map((loc) => (
              <Option key={loc.id} value={loc.name}>
                {loc.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <div style={{ flex: 1 }}>
        <Form.Item label="Scholarship For" name="scholarshipFor">
          <Select placeholder="Select Scholarship For" allowClear>
            {scholarshipForList.map((item) => (
              <Option key={item.id} value={item.name}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <div style={{ flex: 1 }}>
        <Form.Item label="Scholarship Type" name="scholarshipType">
          <Select placeholder="Select Scholarship Type" allowClear>
            {scholarshipTypes.map((item) => (
              <Option key={item.id} value={item.name}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>
    </div>

    {/* ROW 2 (4 fields) */}
    <div style={{ display: "flex", gap: "15px" }}>
      <div style={{ flex: 1 }}>
        <Form.Item label="Category" name="scholarshipcategory">
          <Select placeholder="Select Category" allowClear>
            {categories.map((item) => (
              <Option key={item.id} value={item.name}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <div style={{ flex: 1 }}>
        <Form.Item label="Apply Month" name="applyMonth">
          <Select placeholder="Select Apply Month" allowClear>
            {applyMonthOptions.map((month) => (
              <Option key={month} value={month}>
                {month}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <div style={{ flex: 1 }}>
        <Form.Item label="Deadline" name="deadline">
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>
      </div>

      <div style={{ flex: 1 }}>
        <Form.Item label="Amount" name="amount">
          <Input placeholder="Enter Amount" />
        </Form.Item>
      </div>
    </div>

    {/* DESCRIPTION (MORE BIGGER) */}
    <Form.Item label="Description" name="description">
      <TextArea rows={15} placeholder="Enter Description" />
    </Form.Item>

    {/* BUTTONS */}
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
      <Button onClick={closeModal}>Cancel</Button>
      <Button type="primary" onClick={handleUpdate}>
        Update
      </Button>
    </div>
  </Form>
</Modal>

    </div>
  );
};

export default ScholarshipList;
