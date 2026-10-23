import React, { useEffect, useState } from "react";
import { Table, Modal, Form, Input, InputNumber, Button, Select, DatePicker, Upload, Space, Typography } from "antd";
import { UploadOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { getAllScholarships, getScholarshipById, updateScholarship } from "./ScholarShipServices";
import AlertService from "../Common/AlertService";
import LoadingOverlay from "../Common/LoadingOverlay";
import ScholarshipFilters from "./ScholarshipFilters";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import { Editor } from "@tinymce/tinymce-react";
import {
  getAllStudyLocation,
  getAllScholarshipFor,
  getAllScholarshipTypes,
  getAllScholarshipCategories,
} from "./SettingDropdownServices";

const { Option } = Select;
const { TextArea } = Input;

// TinyMCE field compatible with Ant Design Form's value/onChange contract.
const DescriptionEditor = ({ value = "", onChange }) => (
  <Editor
    apiKey="4kk710ipyvfsq6vkw2xb192rertkz2jug0nutw35qgxhpy4j"
    value={value || ""}
    onEditorChange={(content) => onChange?.(content)}
    init={{
      height: 500,
      menubar: true,
      plugins: [
        "advlist", "autolink", "lists", "link", "image", "charmap",
        "preview", "anchor", "searchreplace", "visualblocks", "code",
        "fullscreen", "insertdatetime", "media", "table", "paste",
        "help", "wordcount",
      ],
      toolbar:
        "undo redo | formatselect | bold italic backcolor | alignleft aligncenter " +
        "alignright alignjustify | bullist numlist outdent indent | removeformat | help",
      content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
    }}
  />
);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const asText = (value) => value === null || value === undefined ? "" : String(value);
const parseFaqs = (value) => {
  if (Array.isArray(value)) return value.map((faq) => ({ question: asText(faq?.question), answer: asText(faq?.answer) }));
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((faq) => ({ question: asText(faq?.question), answer: asText(faq?.answer) }));
    } catch { /* API may return a non-JSON string; keep a safe empty FAQ row. */ }
  }
  return [{ question: "", answer: "" }];
};
const dateValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};
// The existing API field is testDate. Treat it as a month string in the UI,
// while tolerating legacy YYYY-MM-DD values returned by older records.
const testMonthValue = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (MONTHS.includes(raw)) return raw;
  const parsed = dayjs(raw);
  return parsed.isValid() ? MONTHS[parsed.month()] : raw;
};
const safeScholarshipHref = (value) => {
  const raw = asText(value).trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};
const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const ScholarshipList = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [studyLocations, setStudyLocations] = useState([]);
  const [scholarshipForList, setScholarshipForList] = useState([]);
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [logoFile, setLogoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const fetchDropdownData = async () => {
    try {
      const [locations, forList, types, cats] = await Promise.all([
        getAllStudyLocation(), getAllScholarshipFor(), getAllScholarshipTypes(), getAllScholarshipCategories()
      ]);
      setStudyLocations(Array.isArray(locations) ? locations : []);
      setScholarshipForList(Array.isArray(forList) ? forList : []);
      setScholarshipTypes(Array.isArray(types) ? types : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error("Dropdown Fetch Error:", error);
      AlertService.error("Failed to load scholarship dropdown data.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllScholarships();
      const list = Array.isArray(res) ? res : [];
      setData(list);
      setFilteredData(list);
    } catch (error) {
      console.error("Scholarship fetch error:", error);
      AlertService.error("Failed to fetch scholarships!");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchDropdownData(); }, []);

  const handleFilter = (filters) => {
    let temp = [...data];
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      temp = temp.filter((item) =>
        asText(item.sname).toLowerCase().includes(search) ||
        asText(item.studyLocation).toLowerCase().includes(search) ||
        asText(item.scholarshipcategory ?? item.category).toLowerCase().includes(search)
      );
    }
    if (filters.scholarshipFor) temp = temp.filter((item) => item.scholarshipFor === filters.scholarshipFor);
    if (filters.scholarshipType) temp = temp.filter((item) => item.scholarshipType === filters.scholarshipType);
    if (filters.category) temp = temp.filter((item) => (item.scholarshipcategory ?? item.category) === filters.category);
    if (filters.applyMonth) temp = temp.filter((item) => asText(item.applyMonth).toLowerCase().includes(filters.applyMonth.toLowerCase()));
    setFilteredData(temp);
  };

  const openEditModal = async (record) => {
    setLoading(true);
    try {
      // Prefer the detail endpoint because list responses may omit long-form fields.
      const response = await getScholarshipById(record.id);
      const detail = response?.data ?? response?.scholarship ?? response;
      const fullRecord = detail && typeof detail === "object" && !Array.isArray(detail)
        ? { ...record, ...detail }
        : record;
      setSelectedRecord(fullRecord);
      setLogoFile(null);
      setPdfFile(null);
      setFaqs(parseFaqs(fullRecord.faq));
      form.setFieldsValue({
        sname: asText(fullRecord.sname),
        studyLocation: asText(fullRecord.studyLocation),
        scholarshipFor: asText(fullRecord.scholarshipFor),
        scholarshipType: asText(fullRecord.scholarshipType),
        scholarshipcategory: asText(fullRecord.scholarshipcategory ?? fullRecord.category),
        applyMonth: asText(fullRecord.applyMonth),
        testDate: testMonthValue(fullRecord.testDate),
        testResult: asText(fullRecord.testResult),
        deadline: dateValue(fullRecord.deadline),
        eligibility: asText(fullRecord.eligibility),
        specialRequirement: asText(fullRecord.specialRequirement),
        benefits: asText(fullRecord.benefits),
        description: asText(fullRecord.description),
        examDetails: asText(fullRecord.examDetails),
        amount: fullRecord.amount ?? "",
        qualification: asText(fullRecord.qualification),
        link: asText(fullRecord.link),
        branchCode: asText(fullRecord.branchCode || sessionStorage.getItem("branchCode")),
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Scholarship detail fetch failed; using list record:", error);
      // Preserve the existing edit behavior if the detail endpoint is temporarily unavailable.
      setSelectedRecord(record);
      setLogoFile(null);
      setPdfFile(null);
      setFaqs(parseFaqs(record.faq));
      form.setFieldsValue({
        sname: asText(record.sname), studyLocation: asText(record.studyLocation),
        scholarshipFor: asText(record.scholarshipFor), scholarshipType: asText(record.scholarshipType),
        scholarshipcategory: asText(record.scholarshipcategory ?? record.category), applyMonth: asText(record.applyMonth),
        testDate: testMonthValue(record.testDate), testResult: asText(record.testResult), deadline: dateValue(record.deadline),
        eligibility: asText(record.eligibility), specialRequirement: asText(record.specialRequirement),
        benefits: asText(record.benefits), description: asText(record.description), examDetails: asText(record.examDetails),
        amount: record.amount ?? "", qualification: asText(record.qualification), link: asText(record.link),
        branchCode: asText(record.branchCode || sessionStorage.getItem("branchCode")),
      });
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setSelectedRecord(null);
    setLogoFile(null);
    setPdfFile(null);
    setFaqs([{ question: "", answer: "" }]);
    form.resetFields();
  };

  const handleUpdate = async () => {
    if (!selectedRecord?.id) {
      AlertService.error("Cannot update scholarship: record ID is missing.");
      return;
    }
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...selectedRecord,
        ...values,
        category: values.scholarshipcategory,
        scholarshipcategory: values.scholarshipcategory,
        amount: values.amount === "" || values.amount === null ? 0 : Number(values.amount),
        testDate: values.testDate || null,
        deadline: values.deadline ? values.deadline.format("YYYY-MM-DD") : null,
        faq: JSON.stringify(faqs),
        // Keep saved files when no replacement file is selected.
        logo: logoFile ? await toBase64(logoFile) : (selectedRecord.logo ?? ""),
        pdf: pdfFile ? await toBase64(pdfFile) : (selectedRecord.pdf ?? ""),
        branchCode: values.branchCode || selectedRecord.branchCode || sessionStorage.getItem("branchCode") || "",
      };
      await updateScholarship(selectedRecord.id, payload);
      const updated = data.map((item) => String(item.id) === String(selectedRecord.id) ? { ...item, ...payload } : item);
      setData(updated);
      setFilteredData((previous) => previous.map((item) => String(item.id) === String(selectedRecord.id) ? { ...item, ...payload } : item));
      AlertService.success("Updated Successfully!");
      setIsModalOpen(false);
      setSelectedRecord(null);
      form.resetFields();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Update error:", error);
      AlertService.error(error?.response?.data?.message || "Update Failed!");
    } finally { setSaving(false); }
  };

  const columns = [
    { title: "Sr No", key: "srNo", width: 80, render: (_text, _record, index) => index + 1 },
    { title: "Scholarship Name", dataIndex: "sname", key: "sname", render: (text, record) => <span style={{ cursor: "pointer", fontWeight: 500 }} onClick={() => openEditModal(record)}>{text}</span> },
    { title: "Study Location", dataIndex: "studyLocation", key: "studyLocation" },
    { title: "Scholarship For", dataIndex: "scholarshipFor", key: "scholarshipFor" },
    { title: "Scholarship Type", dataIndex: "scholarshipType", key: "scholarshipType" },
    { title: "Category", dataIndex: "scholarshipcategory", key: "scholarshipcategory", render: (_text, record) => record.scholarshipcategory ?? record.category ?? "-" },
    { title: "Apply Month", dataIndex: "applyMonth", key: "applyMonth" },
    { title: "Deadline", dataIndex: "deadline", key: "deadline" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    {
      title: "Scholarship Link",
      dataIndex: "link",
      key: "link",
      width: 180,
      render: (value) => {
        const href = safeScholarshipHref(value);
        if (!href) return "—";
        return <a href={href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} style={{ display: "inline-block", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asText(value)}</a>;
      },
    },
    { title: "Description", dataIndex: "description", key: "description", render: (text) => <Tooltip title={text}><div style={{ maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}>{text}</div></Tooltip> },
  ];

  const fileUploadProps = (accept, setter) => ({
    accept, maxCount: 1, beforeUpload: (file) => { setter(file); return false; },
    onRemove: () => { setter(null); return true; }, fileList: undefined,
  });

  return (
    <div style={{ padding: 20, position: "relative" }}>
      <LoadingOverlay loading={loading || saving} />
      <ScholarshipFilters onFilter={handleFilter} totalCount={filteredData.length}
        studyLocations={studyLocations.map((x) => x.name)}
        scholarshipForList={scholarshipForList.map((x) => x.name)}
        scholarshipTypes={scholarshipTypes.map((x) => x.name)}
        categories={categories.map((x) => x.name)} />
      <Table columns={columns} dataSource={filteredData} rowKey="id"
        pagination={{ defaultPageSize: 25, pageSizeOptions: ["25", "50", "100"], showSizeChanger: true, position: ["bottomRight"] }}
        scroll={{ x: "max-content" }}
        onRow={(record) => ({ onClick: () => openEditModal(record) })} />

      <Modal title="Update Scholarship" open={isModalOpen} onCancel={closeModal} footer={null} width={1100} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleUpdate}>
          <Typography.Title level={5}>Basic Details</Typography.Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            <Form.Item label="Scholarship Name" name="sname" rules={[{ required: true, message: "Scholarship Name is required" }]}><Input placeholder="Enter Scholarship Name" /></Form.Item>
            <Form.Item label="Study Location" name="studyLocation" rules={[{ required: true, message: "Study Location is required" }]}><Select placeholder="Select Study Location" allowClear>{studyLocations.map((x) => <Option key={x.id} value={x.name}>{x.name}</Option>)}</Select></Form.Item>
            <Form.Item label="Scholarship For" name="scholarshipFor" rules={[{ required: true, message: "Scholarship For is required" }]}><Select placeholder="Select Scholarship For" allowClear>{scholarshipForList.map((x) => <Option key={x.id} value={x.name}>{x.name}</Option>)}</Select></Form.Item>
            <Form.Item label="Qualification" name="qualification"><Input /></Form.Item>
            <Form.Item label="Branch Code" name="branchCode" rules={[{ required: true, message: "Branch Code is required" }]}><Input /></Form.Item>
            <Form.Item label="Scholarship Type" name="scholarshipType" rules={[{ required: true, message: "Scholarship Type is required" }]}><Select placeholder="Select Scholarship Type" allowClear>{scholarshipTypes.map((x) => <Option key={x.id} value={x.name}>{x.name}</Option>)}</Select></Form.Item>
            <Form.Item label="Category" name="scholarshipcategory" rules={[{ required: true, message: "Category is required" }]}><Select placeholder="Select Category" allowClear>{categories.map((x) => <Option key={x.id} value={x.name}>{x.name}</Option>)}</Select></Form.Item>
            <Form.Item label="Apply Month" name="applyMonth" rules={[{ required: true, message: "Apply Month is required" }]}><Select placeholder="Select Apply Month" allowClear>{MONTHS.map((month) => <Option key={month} value={month}>{month}</Option>)}</Select></Form.Item>
            <Form.Item label="Amount" name="amount" rules={[
              { required: true, message: "Amount is required" },
              { validator: (_, value) => value === null || value === undefined || value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0) ? Promise.resolve() : Promise.reject(new Error("Enter a valid non-negative amount")) },
            ]}>
              <InputNumber min={0} step={"any"} stringMode={false} style={{ width: "100%" }} placeholder="Enter amount" />
            </Form.Item>
            <Form.Item label="Scholarship Link" name="link"><Input /></Form.Item>
            <Form.Item label="Test Month" name="testDate" extra="Select the month only; no day or year is required."><Select placeholder="Select Test Month" allowClear>{MONTHS.map((month) => <Option key={month} value={month}>{month}</Option>)}</Select></Form.Item>
            <Form.Item label="Test Result" name="testResult" rules={[{ required: true, message: "Test Result is required" }]}><Select placeholder="Select Test Result Month" allowClear>{MONTHS.map((month) => <Option key={month} value={month}>{month}</Option>)}</Select></Form.Item>
            <Form.Item label="Deadline" name="deadline" rules={[{ required: true, message: "Deadline is required" }]}><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item>
          </div>
          <Typography.Title level={5}>Eligibility & Description</Typography.Title>
          <Form.Item label="Eligibility" name="eligibility" rules={[{ required: true, message: "Eligibility is required" }]}><TextArea rows={2} /></Form.Item>
          <Form.Item label="Benefits" name="benefits"><TextArea rows={2} /></Form.Item>
          <Form.Item label="Special Requirement" name="specialRequirement"><TextArea rows={2} /></Form.Item>
          <Form.Item label="Exam Details" name="examDetails"><TextArea rows={2} /></Form.Item>
          <Form.Item label="Description" name="description"><DescriptionEditor /></Form.Item>

          <Typography.Title level={5}>Uploads</Typography.Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div><Typography.Text strong>Upload Logo</Typography.Text><div style={{ marginTop: 8 }}><Upload {...fileUploadProps("image/*", setLogoFile)}><Button icon={<UploadOutlined />}>Choose logo</Button></Upload>{selectedRecord?.logo && !logoFile && <Typography.Text type="secondary"> Existing logo retained unless replaced.</Typography.Text>}</div></div>
            <div><Typography.Text strong>Upload PDF</Typography.Text><div style={{ marginTop: 8 }}><Upload {...fileUploadProps("application/pdf", setPdfFile)}><Button icon={<UploadOutlined />}>Choose PDF</Button></Upload>{selectedRecord?.pdf && !pdfFile && <Typography.Text type="secondary"> Existing PDF retained unless replaced.</Typography.Text>}</div></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 12 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>FAQ's</Typography.Title>
            <Button icon={<PlusOutlined />} onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}>Add FAQ</Button>
          </div>
          {faqs.map((faq, index) => <Space key={index} align="start" style={{ display: "flex", marginBottom: 12 }} wrap>
            <Form.Item label={`Question ${index + 1}`} required style={{ minWidth: 280, flex: 1 }}><Input value={faq.question} onChange={(e) => setFaqs((prev) => prev.map((item, i) => i === index ? { ...item, question: e.target.value } : item))} /></Form.Item>
            <Form.Item label={`Answer ${index + 1}`} required style={{ minWidth: 280, flex: 1 }}><TextArea rows={1} value={faq.answer} onChange={(e) => setFaqs((prev) => prev.map((item, i) => i === index ? { ...item, answer: e.target.value } : item))} /></Form.Item>
            <Button danger icon={<DeleteOutlined />} disabled={faqs.length <= 1} onClick={() => setFaqs((prev) => prev.filter((_item, i) => i !== index))} style={{ marginTop: 30 }} />
          </Space>)}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <Button onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>Update Scholarship</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ScholarshipList;
