import { toast } from 'react-toastify';

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getTeamMembers = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "role_c" } },
        { field: { Name: "permissions_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "created_at_c" } },
        { field: { Name: "updated_at_c" } },
        { field: { Name: "last_login_c" } }
      ],
      orderBy: [{ fieldName: "Name", sorttype: "ASC" }],
      pagingInfo: { limit: 100, offset: 0 }
    };

    const response = await apperClient.fetchRecords('team_member_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }

    return response.data || [];
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching team members:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return [];
  }
};
export const getTeamMemberById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email_c" } },
        { field: { Name: "role_c" } },
        { field: { Name: "permissions_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "created_at_c" } },
        { field: { Name: "updated_at_c" } },
        { field: { Name: "last_login_c" } }
      ]
    };

    const response = await apperClient.getRecordById('team_member_c', parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error("Team member not found");
    }

    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching team member:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw new Error("Team member not found");
  }
};
export const inviteTeamMember = async (memberData) => {
  try {
    // Validate required fields
    if (!memberData.Name || !memberData.Name.trim()) {
      throw new Error("Member name is required");
    }
    
    if (!memberData.email_c || !memberData.email_c.trim()) {
      throw new Error("Member email is required");
    }

    const params = {
      records: [
        {
          Name: memberData.Name.trim(),
          email_c: memberData.email_c.trim().toLowerCase(),
          role_c: memberData.role_c || "viewer",
          permissions_c: memberData.permissions_c || JSON.stringify({
            dashboard: true,
            leads: false,
            hotlist: false,
            pipeline: false,
            calendar: false,
            analytics: false,
            leaderboard: false,
            contacts: false
          }),
          status_c: "pending",
          created_at_c: new Date().toISOString(),
          updated_at_c: new Date().toISOString(),
          last_login_c: null
        }
      ]
    };

    const response = await apperClient.createRecord('team_member_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create team member ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to create team member");
      }
      
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord) {
        toast.success("Team member invited successfully");
        return successfulRecord.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error inviting team member:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};
export const updateTeamMember = async (id, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at_c: new Date().toISOString()
    };

    const params = {
      records: [
        {
          Id: parseInt(id),
          ...updateData
        }
      ]
    };

    const response = await apperClient.updateRecord('team_member_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Team member not found");
    }

    if (response.results) {
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update team member ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to update team member");
      }
      
      const successfulUpdate = response.results.find(result => result.success);
      if (successfulUpdate) {
        toast.success("Team member updated successfully");
        return successfulUpdate.data;
      }
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error updating team member:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};
export const removeTeamMember = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord('team_member_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      throw new Error("Team member not found");
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete team member ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
        throw new Error("Failed to delete team member");
      }
      
      toast.success("Team member removed successfully");
      return { success: true };
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error removing team member:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
};
export const getTeamMemberPerformance = async (id) => {
  try {
    // Get team member details first
    const member = await getTeamMemberById(id);
    
    // Get performance data from related tables
    const [leadsResponse, dealsResponse] = await Promise.all([
      apperClient.fetchRecords('lead_c', {
        fields: [{ field: { Name: "Id" } }],
        where: [{ FieldName: "added_by_c", Operator: "EqualTo", Values: [parseInt(id)] }],
        pagingInfo: { limit: 1000, offset: 0 }
      }),
      apperClient.fetchRecords('deal_c', {
        fields: [{ field: { Name: "Id" } }, { field: { Name: "value_c" } }],
        where: [{ FieldName: "assigned_rep_c", Operator: "Contains", Values: [member.Name] }],
        pagingInfo: { limit: 1000, offset: 0 }
      })
    ]);

    const totalLeads = leadsResponse.success ? (leadsResponse.total || 0) : 0;
    const deals = dealsResponse.success ? (dealsResponse.data || []) : [];
    const totalDeals = deals.length;
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.value_c || 0), 0);
    const avgDealSize = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;
    const conversionRate = totalLeads > 0 ? Math.round((totalDeals / totalLeads) * 100) : 0;

    return {
      totalLeads,
      totalDeals,
      totalRevenue,
      totalMeetings: Math.floor(totalLeads * 0.3), // Estimated
      conversionRate,
      avgDealSize
    };
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching team member performance:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    throw new Error("Team member not found");
  }
};
export const activateTeamMember = async (id) => {
  try {
    return await updateTeamMember(id, { status_c: "active" });
  } catch (error) {
    throw error;
  }
};

export const deactivateTeamMember = async (id) => {
  try {
    return await updateTeamMember(id, { status_c: "inactive" });
  } catch (error) {
    throw error;
  }
};