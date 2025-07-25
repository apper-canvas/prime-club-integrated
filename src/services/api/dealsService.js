import { toast } from 'react-toastify';

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getDeals = async (year = null) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "lead_name_c" } },
        { field: { Name: "lead_id_c" } },
        { field: { Name: "value_c" } },
        { field: { Name: "stage_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "start_month_c" } },
        { field: { Name: "end_month_c" } },
        { field: { Name: "created_at_c" } }
      ],
      where: [],
      orderBy: [{ fieldName: "created_at_c", sorttype: "DESC" }],
      pagingInfo: { limit: 1000, offset: 0 }
    };

    if (year) {
      params.where.push({
        FieldName: "created_at_c",
        Operator: "Contains",
        Values: [year.toString()]
      });
    }

    const response = await apperClient.fetchRecords('deal_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }

    return response.data || [];
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching deals:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return [];
  }
};

export const getDealById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "lead_name_c" } },
        { field: { Name: "lead_id_c" } },
        { field: { Name: "value_c" } },
        { field: { Name: "stage_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "start_month_c" } },
        { field: { Name: "end_month_c" } },
        { field: { Name: "created_at_c" } }
      ]
    };

    const response = await apperClient.getRecordById('deal_c', parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error("Deal not found");
    }

    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching deal:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw new Error("Deal not found");
  }
};

export const createDeal = async (dealData) => {
  try {
    const params = {
      records: [
        {
          Name: dealData.Name,
          lead_name_c: dealData.lead_name_c,
          lead_id_c: dealData.lead_id_c,
          value_c: parseFloat(dealData.value_c || 0),
          stage_c: dealData.stage_c,
          assigned_rep_c: dealData.assigned_rep_c,
          edition_c: dealData.edition_c,
          start_month_c: parseInt(dealData.start_month_c || 0),
          end_month_c: parseInt(dealData.end_month_c || 0),
          created_at_c: new Date().toISOString()
        }
      ]
    };

    const response = await apperClient.createRecord('deal_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create deal ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to create deal");
      }
      
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord) {
        toast.success("Deal created successfully");
        return successfulRecord.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error creating deal:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const updateDeal = async (id, updates) => {
  try {
    const updateData = { ...updates };
    
    // Format numeric fields
    if (updateData.value_c !== undefined) {
      updateData.value_c = parseFloat(updateData.value_c || 0);
    }
    if (updateData.start_month_c !== undefined) {
      updateData.start_month_c = parseInt(updateData.start_month_c || 0);
    }
    if (updateData.end_month_c !== undefined) {
      updateData.end_month_c = parseInt(updateData.end_month_c || 0);
    }

    const params = {
      records: [
        {
          Id: parseInt(id),
          ...updateData
        }
      ]
    };

    const response = await apperClient.updateRecord('deal_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Deal not found");
    }

    if (response.results) {
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update deal ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to update deal");
      }
      
      const successfulUpdate = response.results.find(result => result.success);
      if (successfulUpdate) {
        toast.success("Deal updated successfully");
        return successfulUpdate.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error updating deal:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const deleteDeal = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord('deal_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Deal not found");
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete deal ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to delete deal");
      }
      
      toast.success("Deal deleted successfully");
      return { success: true };
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error deleting deal:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};