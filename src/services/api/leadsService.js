import { toast } from "react-toastify";
import React from "react";
import Error from "@/components/ui/Error";

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

// Track all URLs that have ever been added to the system (for fresh lead detection)
const leadHistoryTracker = new Map();

// Initialize history tracker - will be populated when leads are fetched
const initializeLeadHistory = (leadsArray) => {
  leadsArray.forEach(lead => {
    if (lead.website_url_c) {
      const normalizedUrl = lead.website_url_c.toLowerCase().replace(/\/$/, '');
      leadHistoryTracker.set(normalizedUrl, true);
    }
  });
};
// Utility function to remove duplicate website URLs, keeping the most recent entry
const deduplicateLeads = (leadsArray) => {
  const urlMap = new Map();
  const duplicates = [];
  
  // Sort by creation date (most recent first) to keep the latest entry
  const sortedLeads = [...leadsArray].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
sortedLeads.forEach(lead => {
    const normalizedUrl = lead.website_url_c?.toLowerCase().replace(/\/$/, '') || ''; // Remove trailing slash and normalize
    
    // Update history tracker
    if (normalizedUrl) {
      leadHistoryTracker.set(normalizedUrl, true);
    }
    if (urlMap.has(normalizedUrl)) {
      duplicates.push(lead);
    } else {
      urlMap.set(normalizedUrl, lead);
    }
  });
return {
    uniqueLeads: Array.from(urlMap.values()),
    duplicatesRemoved: duplicates,
    duplicateCount: duplicates.length
  };
};

export const getLeads = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "team_size_c" } },
        { field: { Name: "arr_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "linkedin_url_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "funding_type_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "follow_up_date_c" } },
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ],
      orderBy: [{ fieldName: "created_at_c", sorttype: "DESC" }],
      pagingInfo: { limit: 1000, offset: 0 }
    };

    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return { leads: [], deduplicationResult: null };
}

    const leads = response.data || [];
    
    // Initialize lead history tracker with fetched leads
    initializeLeadHistory(leads);
    
    return {
      leads,
      deduplicationResult: null
    };
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching leads:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return { leads: [], deduplicationResult: null };
  }
};

export const getLeadById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "team_size_c" } },
        { field: { Name: "arr_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "linkedin_url_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "funding_type_c" } },
        { field: { Name: "edition_c" } },
        { field: { Name: "follow_up_date_c" } },
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ]
    };

    const response = await apperClient.getRecordById('lead_c', parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error("Lead not found");
    }

    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching lead:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw new Error("Lead not found");
  }
};

export const createLead = async (leadData) => {
  try {
    // Validate required fields
    if (!leadData.website_url_c || !leadData.website_url_c.trim()) {
      throw new Error("Website URL is required");
    }

    const params = {
      records: [
        {
          Name: leadData.Name || leadData.website_url_c,
          website_url_c: leadData.website_url_c,
          team_size_c: leadData.team_size_c || "1-3",
          arr_c: parseFloat(leadData.arr_c || 0),
          category_c: leadData.category_c || "Other",
          linkedin_url_c: leadData.linkedin_url_c || "",
          status_c: leadData.status_c || "New",
          funding_type_c: leadData.funding_type_c || "Bootstrapped",
          edition_c: leadData.edition_c || "Select Edition",
          follow_up_date_c: leadData.follow_up_date_c || null,
          added_by_c: parseInt(leadData.added_by_c || 1),
          created_at_c: new Date().toISOString()
        }
      ]
    };

    const response = await apperClient.createRecord('lead_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create lead ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to create lead");
      }
      
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord) {
        toast.success("Lead created successfully");
        return successfulRecord.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error creating lead:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const updateLead = async (id, updates) => {
  try {
    const updateData = { ...updates };
    
    // Format numeric fields
    if (updateData.arr_c !== undefined) {
      updateData.arr_c = parseFloat(updateData.arr_c || 0);
    }
    if (updateData.added_by_c !== undefined) {
      updateData.added_by_c = parseInt(updateData.added_by_c);
    }

    const params = {
      records: [
        {
          Id: parseInt(id),
          ...updateData
        }
      ]
    };

    const response = await apperClient.updateRecord('lead_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Lead not found");
    }

    if (response.results) {
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update lead ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to update lead");
      }
      
      const successfulUpdate = response.results.find(result => result.success);
      if (successfulUpdate) {
        toast.success("Lead updated successfully");
        return successfulUpdate.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error updating lead:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const deleteLead = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord('lead_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Lead not found");
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete lead ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to delete lead");
      }
      
      toast.success("Lead deleted successfully");
      return { success: true };
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error deleting lead:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};

export const getDailyLeadsReport = async () => {
  try {
    // Get all leads first
    const { leads } = await getLeads();
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Filter leads created today
    const todaysLeads = leads.filter(lead => {
      if (!lead.created_at_c) return false;
      const leadDate = lead.created_at_c.split('T')[0];
      return leadDate === today;
    });
    
    // Group by sales rep
    const reportData = {};
    
    // Add today's leads to the respective sales reps
    todaysLeads.forEach(lead => {
      const repId = lead.added_by_c || 'Unknown';
      const repName = `Sales Rep ${repId}`;
      
      if (!reportData[repName]) {
        reportData[repName] = {
          salesRep: repName,
          salesRepId: repId,
          leads: [],
          leadCount: 0,
          lowPerformance: false
        };
      }
      
      reportData[repName].leads.push(lead);
    });
    
    // Calculate lead counts and identify low performers
    Object.values(reportData).forEach(repData => {
      repData.leadCount = repData.leads.length;
      repData.lowPerformance = repData.leadCount < 5;
    });
    
    // Convert to array and sort by lead count (descending)
    return Object.values(reportData).sort((a, b) => b.leads.length - a.leads.length);
  } catch (error) {
    console.error('Error generating daily leads report:', error);
    return [];
  }
};

export const getPendingFollowUps = async () => {
  try {
    // Get all leads first
    const { leads } = await getLeads();
    
    // Get current date and 7 days from now
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    // Filter leads with follow-up dates within the next 7 days
    const pendingFollowUps = leads.filter(lead => {
      if (!lead.follow_up_date_c) return false;
      
      const followUpDate = new Date(lead.follow_up_date_c);
      return followUpDate >= now && followUpDate <= sevenDaysFromNow;
    });
    
    // Sort by follow-up date (earliest first)
    return pendingFollowUps.sort((a, b) => new Date(a.follow_up_date_c) - new Date(b.follow_up_date_c));
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error);
    return [];
  }
};
// Get only fresh leads that have never existed in the system before
export const getFreshLeadsOnly = async (leadsArray) => {
  try {
    if (!Array.isArray(leadsArray)) {
      return [];
    }
    
    const freshLeads = leadsArray.filter(lead => {
      if (!lead.website_url_c || !lead.created_at_c) return false;
      
      const normalizedUrl = lead.website_url_c.toLowerCase().replace(/\/$/, '');
      // Check if this URL was added today and wasn't in the system before today
      const leadDate = new Date(lead.created_at_c);
      const today = new Date();
      
      // If lead was created today and URL never existed before, it's fresh
      return leadDate.toDateString() === today.toDateString() && 
             !wasUrlPreviouslyAdded(normalizedUrl, leadDate);
    });
    
    return freshLeads;
  } catch (error) {
    console.error('Error filtering fresh leads:', error);
    return [];
  }
};

// Helper function to check if URL existed before a given date
const wasUrlPreviouslyAdded = async (normalizedUrl, currentDate) => {
  try {
    // Get all leads to check against
    const { leads } = await getLeads();
    
    // Check if any existing lead with this URL was created before the current date
    const existingLeads = leads.filter(lead => {
      if (!lead.website_url_c || !lead.created_at_c) return false;
      
      const existingNormalizedUrl = lead.website_url_c.toLowerCase().replace(/\/$/, '');
      return existingNormalizedUrl === normalizedUrl && 
             new Date(lead.created_at_c) < currentDate;
    });
    
    return existingLeads.length > 0;
  } catch (error) {
    console.error('Error checking if URL was previously added:', error);
    return false;
  }
};