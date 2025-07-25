import { toast } from 'react-toastify';

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getContacts = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "company_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "notes_c" } },
        { field: { Name: "created_at_c" } }
      ],
      orderBy: [{ fieldName: "Name", sorttype: "ASC" }],
      pagingInfo: { limit: 1000, offset: 0 }
    };

    const response = await apperClient.fetchRecords('app_contact_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }

    return response.data || [];
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching contacts:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return [];
  }
};

export const getContactById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "company_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "assigned_rep_c" } },
        { field: { Name: "notes_c" } },
        { field: { Name: "created_at_c" } }
      ]
    };

    const response = await apperClient.getRecordById('app_contact_c', parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error("Contact not found");
    }

    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching contact:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw new Error("Contact not found");
  }
};

export const createContact = async (contactData) => {
  try {
    const params = {
      records: [
        {
          Name: contactData.Name,
          email_c: contactData.email_c,
          company_c: contactData.company_c,
          status_c: contactData.status_c || "New",
          assigned_rep_c: contactData.assigned_rep_c,
          notes_c: contactData.notes_c,
          created_at_c: new Date().toISOString()
        }
      ]
    };

    const response = await apperClient.createRecord('app_contact_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create contact ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to create contact");
      }
      
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord) {
        toast.success("Contact created successfully");
        return successfulRecord.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error creating contact:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }    
};

export const updateContact = async (id, updates) => {
  try {
    const params = {
      records: [
        {
          Id: parseInt(id),
          ...updates
        }
      ]
    };

    const response = await apperClient.updateRecord('app_contact_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Contact not found");
    }

    if (response.results) {
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update contact ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to update contact");
      }
      
      const successfulUpdate = response.results.find(result => result.success);
      if (successfulUpdate) {
        toast.success("Contact updated successfully");
        return successfulUpdate.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error updating contact:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const deleteContact = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord('app_contact_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Contact not found");
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete contact ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to delete contact");
      }
      
      toast.success("Contact deleted successfully");
      return { success: true };
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error deleting contact:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};