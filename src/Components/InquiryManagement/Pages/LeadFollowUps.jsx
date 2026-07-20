import React, { useCallback, useEffect, useState } from 'react';
import { updateEnquiry } from './AbroadInquiryService';
import {
  addLeadVisit,
  getVisitsByLeadId
} from './leadService';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Table, Space, Popconfirm } from 'antd';
import LoadingOverlay from '../../Common/LoadingOverlay';
import AlertService from '../../Common/AlertService';

// Status options matching the InquiryFilter component
const statusOptions = [
  { value: 'pending', label: 'INTERESTED', color: 'green' },
  { value: 'approved', label: 'NOT INTERESTED', color: 'red' },
  { value: 'connecting', label: 'CONNECTING', color: 'orange' },
  { value: 'ringing', label: 'RINGING', color: 'gold' },
  { value: 'callBack', label: 'CALL BACK', color: 'lightgreen' },
  { value: 'officeVisit', label: 'OFFICE VISIT', color: '#9c27b0' }
];

const countOptions = [
  "Visit1/call1", "Visit2/call2", "Visit3/call3", "Visit4/call4", "Visit5/call5", "Visit6/call6"
];

const styles = {
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057',
    backgroundColor: '#f1f3f5',
    borderBottom: '2px solid #dee2e6',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'top',
    wordBreak: 'break-word'
  },
  tdCenter: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    verticalAlign: 'middle'
  },
  tr: {
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  noData: {
    textAlign: 'center',
    padding: '24px',
    color: '#6c757d',
    fontStyle: 'italic'
  }
};

const LeadFollowUps = ({ leadId: enquiry_id, open, role, email, onStatusChange }) => {
  const [visits, setVisits] = useState([]);
  const [remark, setRemark] = useState('');
  const [status, setStatus] = useState('callBack'); // Default to 'callBack' which was previously 'Visit/CallBack'
  const [visitCount, setVisitCount] = useState('Visit1/call1');
  const [loading, setLoading] = useState(false);
  const [fetchingVisits, setFetchingVisits] = useState(false);



  const fetchVisits = useCallback(async () => {
    if (!enquiry_id) return;

    setFetchingVisits(true);
    try {
      console.log(`Fetching visits for enquiry ID: ${enquiry_id}`);
      const data = await getVisitsByLeadId(enquiry_id, role, email);
      console.log("Visits fetched:", data);

      // Ensure data is an array and sort by date in descending order (newest first)
      const sortedData = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const dateDiff = new Date(b.visitDate) - new Date(a.visitDate);
            if (dateDiff !== 0) return dateDiff;
            // Fallback: sort by id (assuming higher id is newer)
            if (typeof b.id === 'number' && typeof a.id === 'number') {
              return b.id - a.id;
            }
            return (b.id || '').toString().localeCompare((a.id || '').toString());
          })
        : [];

      console.log("Sorted visits (newest first):", sortedData);
      setVisits(sortedData);
    } catch (error) {
      console.error("Failed to fetch visits:", error);
      setVisits([]);
      AlertService.error('Failed to load follow-ups. Please try again.');
    } finally {
      setFetchingVisits(false);
    }
  }, [enquiry_id, role, email]);

  useEffect(() => {
    if (open && enquiry_id) fetchVisits();
  }, [open, enquiry_id, role, email, fetchVisits]);

  const handleAddVisit = async () => {
    // Validate required fields
    if (!remark) {
      AlertService.error('Please enter a remark');
      return;
    }

    // Store current form values before resetting
    const currentRemark = remark;
    const currentStatus = status;
    const currentVisitCount = visitCount;

    // Create a temporary object for optimistic UI update
    const tempId = 'temp-' + Date.now();
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString(); // Use full timestamp in UTC

    const newVisit = {
      id: tempId,
      visitDate: formattedDate,
      remark: currentRemark,
      status: currentStatus,
      visitCount: currentVisitCount,
      lead_id: enquiry_id,
      // Format date for display (similar to what the API might return)
      created_at: formattedDate,
      updated_at: formattedDate
    };

    // Reset form fields immediately for better UX
    setRemark('');
    setStatus('Visit/CallBack');
    setVisitCount('Visit1/call1');

    setLoading(true);

    try {
      console.log(`Adding visit for enquiry ID: ${enquiry_id}`);

      // First update the UI optimistically
      console.log("Adding optimistic update to visits:", newVisit);

      // Insert the new visit, then sort by visitDate descending before setting
      setVisits(prevVisits => {
        const updated = [newVisit, ...prevVisits];
        return updated.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      });


      // Then make the API call
      await addLeadVisit(enquiry_id, currentRemark, currentStatus, currentVisitCount, role, email);

      // Update the enquiry status in the backend
      await updateEnquiry(enquiry_id, { status: currentStatus }, null, role, email);

      // Notify parent to update status in UI (fetch latest status from backend)
      const updatedVisits = await getVisitsByLeadId(enquiry_id, role, email);
      if (Array.isArray(updatedVisits) && updatedVisits.length > 0) {
        const latestStatus = updatedVisits[0].status || null;
        if (typeof onStatusChange === 'function') {
          onStatusChange(latestStatus);
        }
      }

      // Show success message
      AlertService.success('Follow-up added successfully!');

      // Refresh the visits list after a delay to ensure data is synced with the server
      console.log("Scheduling refresh after successful add");
      setTimeout(() => {
        console.log("Refreshing visits from server");
        fetchVisits();
      }, 1000); // 1 second delay as requested
    } catch (error) {
      console.error("Failed to add visit:", error);

      // Remove the optimistic entry on error
      setVisits(prevVisits => {
        console.log("Removing optimistic update due to error");
        return prevVisits.filter(visit => visit.id !== tempId);
      });

      // Show error message with details if available
      const errorMessage = error.response?.data?.message || error.message || "Failed to add follow-up";
      AlertService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <LoadingOverlay loading={loading || fetchingVisits} />
      <div style={{ marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <TextField
          select
          label="Visit/Call Count"
          value={visitCount}
          onChange={e => setVisitCount(e.target.value)}
          size="small"
          style={{ flex: 1 }}
          disabled={loading}
        >
          {countOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          size="small"
          style={{ flex: 1 }}
          disabled={loading}
        >
          {statusOptions.map(opt => (
            <MenuItem key={opt.value} value={opt.value} style={{ color: opt.color }}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Remark"
          value={remark}
          onChange={e => setRemark(e.target.value)}
          size="small"
          style={{ flex: 2 }}
          required
          disabled={loading}
        />
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#2c3e50' }}>Status History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Visit Count</th>
                <th style={styles.th}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={5} style={styles.noData}>No follow-ups found</td>
                </tr>
              ) : (
                visits.map((visit, idx) => {
                  const statusConfig = statusOptions.find(opt => opt.value === visit.status) || {};
                  return (
                    <tr key={visit.id} style={styles.tr}>
                      <td style={styles.tdCenter}>{visits.length - idx}</td>
                      <td style={{...styles.td, whiteSpace: 'nowrap'}}>
                        {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-IN') : ''}
                      </td>
                      <td style={{...styles.td, color: statusConfig.color || '#000'}}>
                        {statusConfig.label || visit.status}
                      </td>
                      <td style={styles.tdCenter}>{visit.visitCount}</td>
                      <td style={{...styles.td, maxWidth: '400px'}}>{visit.remark}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24 }}>
        <Button
          onClick={handleAddVisit}
          variant="contained"
          disabled={!remark || loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Adding...' : 'Add Follow Up'}
        </Button>
      </div>
    </>
  );
};

export default LeadFollowUps;