import axiosInstance from '../Common/axiosConfig';

export const partnerService = {
    // Create new partner
    createPartner: async (partnerData) => {
        try {
            const response = await axiosInstance.post('/createPartner', partnerData);
            return response.data;
        } catch (error) {
            console.error('Error creating partner:', error);
            return { error: error.response?.data?.message || 'Failed to create partner' };
        }
    },

    // Filter partners
    filterPartners: async (filters) => {
        try {
            // Get role and createdByEmail from sessionStorage
            const createdByEmail = sessionStorage.getItem('email');
            const role = sessionStorage.getItem('role');

            if (!role || !createdByEmail) {
                throw new Error('User role or createdByEmail not found in session');
            }

            console.log('Sending filter request with role:', role, 'and createdByEmail:', createdByEmail);

            const response = await axiosInstance.post(
                '/filterBecomePartner',
                filters,
                {
                    params: { role, createdByEmail }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error filtering partners:', error);
            return { error: error.message || error.response?.data?.message || 'Failed to filter partners' };
        }
    },

    // Get all partners
    getAllPartners: async (page = 0, size = 10) => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';
            
            // The backend expects a POST request with an empty body for fetching all partners.
            const response = await axiosInstance.post(`/getAllPartners?role=${role}&email=${email}&page=${page}&size=${size}`, {});
            
            return response.data;
        } catch (error) {
            console.error('Error fetching partners:', error);
            // Return a default structure in case of an error to prevent UI crashes.
            return { content: [], totalElements: 0 };
        }
    },

    // Get partner by ID
    getPartnerById: async (id, role, email) => {
        try {
            const response = await axiosInstance.get(`/getPartnerById/${id}`, {
                params: { role, email }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching partner by ID:', error);
            return { error: error.response?.data?.message || 'Failed to fetch partner' };
        }
    },

    // Update partner
    updatePartner: async (id, partnerData, role, email) => {
        try {
            if (!id) {
                throw new Error('Partner ID is required');
            }
            const numericId = Number(id);
            if (isNaN(numericId)) {
                throw new Error('Invalid partner ID');
            }
            const response = await axiosInstance.put(`/updatePartner/${numericId}`, partnerData, {
                params: { role, email }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating partner:', error);
            return { error: error.response?.data?.message || error.message || 'Failed to update partner' };
        }
    },

    // Delete partner
    deletePartner: async (id, role, email) => {
        try {
            if (!id) {
                throw new Error('Partner ID is required');
            }
            const numericId = Number(id);
            if (isNaN(numericId)) {
                throw new Error('Invalid partner ID');
            }
            const response = await axiosInstance.delete(`/deletePartner/${numericId}`, {
                params: { role, email },
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // Resolve only if the status code is less than 500
                }
            });
            
            if (response.status === 200) {
                return { success: true, message: response.data || 'Partner deleted successfully' };
            } else {
                return { 
                    error: response.data?.message || 
                           (response.data || 'Failed to delete partner'),
                    status: response.status
                };
            }
        } catch (error) {
            console.error('Error deleting partner:', error);
            return { 
                error: error.response?.data?.message || 
                       error.message || 
                       'Failed to delete partner',
                status: error.response?.status || 500
            };
        }
    },

    // Upload partner documents
    uploadPartnerDocuments: async (id, files, role, email) => {
        try {
            const formData = new FormData();
            formData.append('contract', files.contract);
            formData.append('commission', files.commission);
            formData.append('pan', files.pan);
            formData.append('gst', files.gst);

            const response = await axiosInstance.post(`/uploadPdf/${id}`, formData, {
                params: { role, email },
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading documents:', error);
            return { error: error.response?.data?.message || 'Failed to upload documents' };
        }
    },

    // Get all countries for dropdown
    getAllCountries: async () => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';
            const branchCode = sessionStorage.getItem('branchCode') || '';
            const response = await axiosInstance.get('/getAllCountries', {
                params: { role, email, branchCode }
            });
            // Transform the data to match dropdown expected format
            return response.data.map(country => ({
                id: country.id,
                name: country.country || country.name || country.countryName
            }));
        } catch (error) {
            console.error('Error fetching countries:', error);
            return [];
        }
    },

    // Get all states for dropdown
    getAllStates: async () => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';
            const response = await axiosInstance.get('/getAllStates', {
                params: { role, email }
            });
            // Transform the data to match dropdown expected format
            return response.data.map(state => ({
                id: state.id,
                name: state.state || state.name || state.stateName
            }));
        } catch (error) {
            console.error('Error fetching states:', error);
            return [];
        }
    },

    // Get all cities for dropdown
    getAllCities: async () => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';
            const response = await axiosInstance.get('/getAllCities', {
                params: { role, email }
            });
            // Transform the data to match dropdown expected format
            return response.data.map(city => ({
                id: city.id,
                name: city.city || city.name || city.cityName
            }));
        } catch (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
    },

    // Get all universities for dropdown
    getAllUniversities: async () => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';
            const branchCode = sessionStorage.getItem('branchCode') || '';
            const response = await axiosInstance.get('/getAllUniversities', {
                params: { role, email, branchCode }
            });
            // Transform the data to match dropdown expected format
            return response.data.map(university => ({
                id: university.id,
                name: university.university || university.name || university.universityName
            }));
        } catch (error) {
            console.error('Error fetching universities:', error);
            return [];
        }
    },

    // Get institute types for dropdown - using static options for now
    getInstituteTypes: async () => {
        try {
            // For now, return static options since API doesn't exist
            return [
                { id: 1, name: "Private" },
                { id: 2, name: "Public" },
                { id: 3, name: "Government" },
                { id: 4, name: "International" }
            ];
        } catch (error) {
            console.error('Error fetching institute types:', error);
            return [];
        }
    },

    // Get contract types for dropdown - using static options for now
    getContractTypes: async () => {
        try {
            // For now, return static options since API doesn't exist
            return [
                { id: 1, name: "Full-time" },
                { id: 2, name: "Part-time" },
                { id: 3, name: "Contract" },
                { id: 4, name: "Temporary" }
            ];
        } catch (error) {
            console.error('Error fetching contract types:', error);
            return [];
        }
    },

    // Get conducted by options for dropdown - using same implementation as formService.js
    getConductedByOptions: async () => {
        try {
            const role = sessionStorage.getItem("role") || "staff";
            const email = sessionStorage.getItem("email") || "";
            const response = await axiosInstance.get("/getAllConductBy", {
                params: { role, email }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching Conducted By list:", error);
            // Return fallback options instead of throwing error
            return [
                { conductBy: "Poonam" },
                { conductBy: "Rohini" },
                { conductBy: "Siddhi" },
                { conductBy: "Radhika" },
                { conductBy: "Padam Sir" }
            ];
        }
    },

    // Get status options for dropdown - using static options for now
    getStatusOptions: async () => {
        try {
            // For now, return static options since API doesn't exist
            return [
                { id: 1, name: "pending" },
                { id: 2, name: "active" },
                { id: 3, name: "inactive" }
            ];
        } catch (error) {
            console.error('Error fetching status options:', error);
            return [];
        }
    },

    // Get status-wise count for partners
    getStatusWiseCount: async () => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';

            const response = await axiosInstance.get('/status-countPartner', {
                params: { role, email }
            });

            return response.data || {};
        } catch (error) {
            console.error('Error fetching status counts:', error);
            return {};
        }
    },
        // Get status-wise count for partners
    getStatusWiseCount: async () => {
        try {
            const email = sessionStorage.getItem('email') || '';
            const role = sessionStorage.getItem('role') || '';

            const response = await axiosInstance.get('/status-countPartner', {
                params: { role, email }
            });

            return response.data || {};
        } catch (error) {
            console.error('Error fetching status counts:', error);
            return {};
        }
    },

    // ✅ Add this new function below
    getAllStaff: async () => {
        try {
            const response = await axiosInstance.get('/getAllStaff');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching staff list:', error);
            return [];
        }
    },
};




// ✅ Get all staff (without branch or email filters)

