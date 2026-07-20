import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import InquiryEdit from "./InquiryEdit";
import AlertService from "../../Common/AlertService";
import { getEnquiryById } from "./AbroadInquiryService";

export default function InquiryDetailsModal({
  visible: open, // Accept both 'visible' and 'open' for backward compatibility
  onClose,
  inquiry,
  onUpdate,
  onDelete
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch inquiry data by ID when modal opens
  useEffect(() => {
    const fetchInquiryData = async () => {
      if (open && inquiry && inquiry.id) {
        setLoading(true);
        try {
          // Get role and email from session storage
          const role = sessionStorage.getItem('role');
          const email = sessionStorage.getItem('email');
          
          const inquiryData = await getEnquiryById(inquiry.id, role, email);
          setFormValues(inquiryData);
        } catch (error) {
          console.error("Failed to fetch inquiry data:", error);
          AlertService.error("Failed to load inquiry data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInquiryData();
  }, [open, inquiry]);

  // Removed handleFormChange as it's not needed in edit mode
  // The form state is managed internally by InquiryEdit component

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await onUpdate(formData);
      AlertService.success("Inquiry updated successfully!");
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      AlertService.error(error.message || "Failed to update inquiry");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    const confirmed = await AlertService.confirm("Are you sure you want to delete this inquiry?");
    if (confirmed) {
      try {
        await onDelete();
        AlertService.success("Inquiry deleted successfully!");
        onClose();
      } catch (error) {
        console.error("Delete failed:", error);
        AlertService.error(error.message || "Failed to delete inquiry");
      }
    }
  };

  return (
    <Modal
      title="Edit Inquiry"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      zIndex={2500}
      style={{ zIndex: 2500 }}
      modalRender={modal => <div style={{ zIndex: 2500, position: 'relative' }}>{modal}</div>}
      confirmLoading={loading}
    >
      <InquiryEdit
        initialValues={formValues}
        onSubmit={handleSubmit}
        onDelete={handleDeleteClick}
        onClose={onClose}
        isSubmitting={isSubmitting}
        isEditMode={true}
        isLoading={loading}
      />
    </Modal>
  );
}