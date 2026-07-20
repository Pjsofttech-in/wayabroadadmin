import React, { useState, useEffect } from "react";
import { Table, Typography, Card, Modal, Descriptions, message } from "antd";
import { Box } from "@mui/material";
import { partnerService } from "./partnerService";
import PartnerFilter from './PartnerFilter';
import PartnerDetailsModal from './PartnerDetailsModal';

const { Title } = Typography;

const PartnerList = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({ name: '' });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const result = await partnerService.getAllPartners();
        let data = Array.isArray(result) ? result : (result && Array.isArray(result.content) ? result.content : []);
        // Filter for conductedBy 'web' or 'Web'
        data = data.filter(partner => partner.conductedBy && partner.conductedBy.toLowerCase() === 'web');
        setPartners(data.map(partner => ({
          key: partner.id,
          name: partner.partnerName || partner.businessName || '',
          email: partner.partnerEmail || partner.businessEmail || '',
          contact: partner.partnerContact || partner.businessContact || '',
          instituteType: partner.instituteType,
          contractType: partner.contractType,
          conductedBy: partner.conductedBy,
          status: partner.status,
          remarks: partner.remark,
          ...partner
        })));
      } catch {
        message.error('Failed to fetch partners. Please try again.');
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [refreshKey]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: 'Institute Type',
      dataIndex: 'instituteType',
      key: 'instituteType',
      filters: [
        { text: 'Private', value: 'private' },
        { text: 'Government', value: 'government' },
        { text: 'Deemed University', value: 'deemed_university' },
        { text: 'College', value: 'college' },
        { text: 'Agency', value: 'agency' },
      ],
      onFilter: (value, record) => record.instituteType === value,
    },
    {
      title: 'Contract Type',
      dataIndex: 'contractType',
      key: 'contractType',
      filters: [
        { text: 'Standard', value: 'standard' },
        { text: 'Premium', value: 'premium' },
        { text: 'Enterprise', value: 'enterprise' },
        { text: 'Custom', value: 'custom' },
      ],
      onFilter: (value, record) => record.contractType === value,
    },
    {
      title: 'Conducted By',
      dataIndex: 'conductedBy',
      key: 'conductedBy',
      filters: [
        { text: 'Poonam', value: 'poonam' },
        { text: 'Rohini', value: 'rohini' },
        { text: 'Siddhi', value: 'siddhi' },
        { text: 'Radhika', value: 'radhika' },
        { text: 'Padam Sir', value: 'padam_sir' },
      ],
      onFilter: (value, record) => record.conductedBy === value,
      render: (conductedBy) => conductedBy && conductedBy.toLowerCase() === 'web' ? 'Web' : conductedBy,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Pending', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span style={{
          color: status === 'active' ? '#52c41a' : 
                 status === 'inactive' ? '#f5222d' : '#faad14',
          fontWeight: 500
        }}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
  ];

  const handlePartnerClick = (partner) => {
    if (partner.conductedBy && partner.conductedBy.toLowerCase() === 'web') {
      setSelectedPartner(partner);
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPartner(null);
  };

  const handleUpdatePartner = (updatedPartner) => {
    if (!updatedPartner?.id) {
      message.error('Failed to update partner: Invalid data');
      return;
    }
    
    setPartners(prevPartners =>
      prevPartners.map(partner =>
        partner.id === updatedPartner.id ? { ...partner, ...updatedPartner } : partner
      )
    );
    setFilteredPartners(prevPartners =>
      prevPartners.map(partner =>
        partner.id === updatedPartner.id ? { ...partner, ...updatedPartner } : partner
      )
    );
    message.success('Partner updated successfully');
    setRefreshKey(prev => prev + 1);
  };

  const handleDeletePartner = (deletedPartnerId) => {
    if (!deletedPartnerId) {
      message.error('Failed to delete partner: Invalid ID');
      return;
    }
    
    setPartners(prevPartners => prevPartners.filter(partner => {
      const shouldKeep = partner.id !== deletedPartnerId;
      return shouldKeep;
    }));
    
    setFilteredPartners(prevPartners => prevPartners.filter(partner => {
      const shouldKeep = partner.id !== deletedPartnerId;
      return shouldKeep;
    }));
    
    message.success('Partner deleted successfully');
    setRefreshKey(prev => prev + 1);
  };

  const handleFilterChange = async (field, value) => {
    try {
      setLoading(true);
      // Update filters state
      const newFilters = { ...filters, [field]: value };
      setFilters(newFilters);
      
      // Call the API with the new filters
      const result = await partnerService.filterPartners(newFilters);
      
      if (result) {
        const filtered = Array.isArray(result) 
          ? result 
          : (result && Array.isArray(result.content) 
            ? result.content 
            : []);
        
        const webPartners = filtered.filter(partner => 
          partner.conductedBy && partner.conductedBy.toLowerCase() === 'web'
        );
        
        console.log('Total filtered web partners:', webPartners.length);
        setFilteredPartners(webPartners);
      }
    } catch (error) {
      console.error('Filter error:', error);
      message.error(`Failed to fetch filtered partners: ${error.message}`);
      setFilteredPartners([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <PartnerFilter 
          onFilterChange={handleFilterChange}
          filters={filters}
          onSearch={(value) => handleFilterChange('name', value)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Total Web Partners: {filteredPartners.length}
          </Typography>
        </Box>
        <Table 
          loading={loading}
          columns={columns} 
          dataSource={filteredPartners.length > 0 ? filteredPartners : partners}
          rowKey={(record) => record.key}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} web partners`
          }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'No web partners found.'
          }}
          onRow={(record) => ({
            onClick: () => handlePartnerClick(record)
          })}
        />
      </Card>
      <PartnerDetailsModal 
        partner={selectedPartner} 
        visible={modalVisible} 
        onClose={handleCloseModal}
        onUpdate={handleUpdatePartner}
        onDelete={handleDeletePartner}
      />
    </>
  );
};

export default PartnerList;
