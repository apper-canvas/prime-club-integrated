import { toast } from 'react-toastify';

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getSalesReps = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted_c" } },
        { field: { Name: "meetings_booked_c" } },
        { field: { Name: "deals_closed_c" } },
        { field: { Name: "total_revenue_c" } }
      ],
      orderBy: [{ fieldName: "Name", sorttype: "ASC" }],
      pagingInfo: { limit: 100, offset: 0 }
    };

    const response = await apperClient.fetchRecords('sales_rep_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }

    return response.data || [];
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching sales reps:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return [];
  }
};

export const getSalesRepById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted_c" } },
        { field: { Name: "meetings_booked_c" } },
        { field: { Name: "deals_closed_c" } },
        { field: { Name: "total_revenue_c" } }
      ]
    };

    const response = await apperClient.getRecordById('sales_rep_c', parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error("Sales rep not found");
    }

    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching sales rep:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw new Error("Sales rep not found");
  }
};

export const createSalesRep = async (repData) => {
  try {
    const params = {
      records: [
        {
          Name: repData.Name,
          leads_contacted_c: 0,
          meetings_booked_c: 0,
          deals_closed_c: 0,
          total_revenue_c: 0
        }
      ]
    };

    const response = await apperClient.createRecord('sales_rep_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create sales rep ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to create sales rep");
      }
      
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord) {
        toast.success("Sales rep created successfully");
        return successfulRecord.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error creating sales rep:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const updateSalesRep = async (id, updates) => {
  try {
    const updateData = { ...updates };
    
    // Format numeric fields
    if (updateData.leads_contacted_c !== undefined) {
      updateData.leads_contacted_c = parseInt(updateData.leads_contacted_c || 0);
    }
    if (updateData.meetings_booked_c !== undefined) {
      updateData.meetings_booked_c = parseInt(updateData.meetings_booked_c || 0);
    }
    if (updateData.deals_closed_c !== undefined) {
      updateData.deals_closed_c = parseInt(updateData.deals_closed_c || 0);
    }
    if (updateData.total_revenue_c !== undefined) {
      updateData.total_revenue_c = parseFloat(updateData.total_revenue_c || 0);
    }

    const params = {
      records: [
        {
          Id: parseInt(id),
          ...updateData
        }
      ]
    };

    const response = await apperClient.updateRecord('sales_rep_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Sales rep not found");
    }

    if (response.results) {
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update sales rep ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to update sales rep");
      }
      
      const successfulUpdate = response.results.find(result => result.success);
      if (successfulUpdate) {
        toast.success("Sales rep updated successfully");
        return successfulUpdate.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error updating sales rep:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const deleteSalesRep = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord('sales_rep_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Sales rep not found");
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete sales rep ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to delete sales rep");
      }
      
      toast.success("Sales rep deleted successfully");
      return { success: true };
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error deleting sales rep:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};