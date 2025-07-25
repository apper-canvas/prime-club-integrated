import { toast } from 'react-toastify';

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});
// Helper function to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekStart,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'month':
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        start: monthStart,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    default:
      return {
        start: new Date(0),
        end: new Date()
      };
  }
};

// Import leads data
import leadsData from '@/services/mockData/leads.json';

// Helper function to filter leads by date range and user
const filterLeads = (period = 'all', userId = 'all') => {
  let filteredLeads = [...leadsData];
  
  // Filter by user (using added_by_c field from database schema)
  if (userId !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.addedBy === parseInt(userId));
  }
  
  // Filter by date range (using created_at_c field from database schema)
  if (period !== 'all') {
    const { start, end } = getDateRange(period);
    filteredLeads = filteredLeads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= start && leadDate < end;
    });
  }
  
  return filteredLeads;
};

export const getLeadsAnalytics = async (period = 'all', userId = 'all') => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url_c" } },
        { field: { Name: "team_size_c" } },
        { field: { Name: "arr_c" } },
        { field: { Name: "category_c" } },
        { field: { Name: "status_c" } },
        { field: { Name: "added_by_c" } },
        { field: { Name: "created_at_c" } }
      ],
      where: [],
      orderBy: [{ fieldName: "created_at_c", sorttype: "DESC" }],
      pagingInfo: { limit: 1000, offset: 0 }
    };

    // Add period filtering
    if (period !== 'all') {
      const dateFilter = getDateFilterForPeriod(period);
      if (dateFilter) params.where.push(dateFilter);
    }

    // Add user filtering
    if (userId !== 'all') {
      params.where.push({
        FieldName: "added_by_c",
        Operator: "EqualTo",
        Values: [parseInt(userId)]
      });
    }

    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return { leads: [], totalCount: 0 };
    }

    return {
      leads: response.data || [],
      totalCount: response.total || 0
    };
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching leads analytics:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return { leads: [], totalCount: 0 };
  }
};

export const getDailyLeadsChart = async (userId = 'all', days = 30) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Id" } },
        { field: { Name: "created_at_c" } },
        { field: { Name: "added_by_c" } }
      ],
      where: [],
      orderBy: [{ fieldName: "created_at_c", sorttype: "DESC" }],
      pagingInfo: { limit: 5000, offset: 0 }
    };

    // Add date range filter for last X days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    params.where.push({
      FieldName: "created_at_c",
      Operator: "GreaterThanOrEqualTo",
      Values: [startDate.toISOString().split('T')[0]]
    });

    // Add user filtering
    if (userId !== 'all') {
      params.where.push({
        FieldName: "added_by_c",
        Operator: "EqualTo",
        Values: [parseInt(userId)]
      });
    }

    const response = await apperClient.fetchRecords('lead_c', params);
    
    if (!response.success) {
      console.error(response.message);
      return {
        chartData: [],
        categories: [],
        series: [{ name: 'New Leads', data: [] }]
      };
    }

    const leads = response.data || [];
    const chartData = [];
    
    // Generate data for the last X days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = leads.filter(lead => {
        const leadDate = lead.created_at_c ? lead.created_at_c.split('T')[0] : null;
        return leadDate === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        count: dayLeads.length,
        formattedDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return {
      chartData,
      categories: chartData.map(item => item.formattedDate),
      series: [
        {
          name: 'New Leads',
          data: chartData.map(item => item.count)
        }
      ]
    };
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching daily leads chart:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return {
      chartData: [],
      categories: [],
      series: [{ name: 'New Leads', data: [] }]
    };
  }
};

export const getLeadsMetrics = async (userId = 'all') => {
  try {
    // Get metrics for different time periods
    const todayMetrics = await getLeadsAnalytics('today', userId);
    const yesterdayMetrics = await getLeadsAnalytics('yesterday', userId);
    const weekMetrics = await getLeadsAnalytics('week', userId);
    const monthMetrics = await getLeadsAnalytics('month', userId);
    const allMetrics = await getLeadsAnalytics('all', userId);

    const todayCount = todayMetrics.totalCount;
    const yesterdayCount = yesterdayMetrics.totalCount;
    const weekCount = weekMetrics.totalCount;
    const monthCount = monthMetrics.totalCount;

    // Calculate percentage changes
    const todayTrend = yesterdayCount === 0 ? 100 : 
      Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);

    // Get status and category distributions
    const allLeads = allMetrics.leads || [];
    const statusCounts = allLeads.reduce((acc, lead) => {
      const status = lead.status_c || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = allLeads.reduce((acc, lead) => {
      const category = lead.category_c || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      metrics: {
        today: {
          count: todayCount,
          trend: todayTrend,
          label: 'Today'
        },
        yesterday: {
          count: yesterdayCount,
          label: 'Yesterday'
        },
        week: {
          count: weekCount,
          label: 'This Week'
        },
        month: {
          count: monthCount,
          label: 'This Month'
        }
      },
      statusDistribution: statusCounts,
      categoryDistribution: categoryCounts,
      totalLeads: allMetrics.totalCount
    };
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching leads metrics:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return {
      metrics: {
        today: { count: 0, trend: 0, label: 'Today' },
        yesterday: { count: 0, label: 'Yesterday' },
        week: { count: 0, label: 'This Week' },
        month: { count: 0, label: 'This Month' }
      },
      statusDistribution: {},
      categoryDistribution: {},
      totalLeads: 0
    };
  }
};

export const getUserPerformance = async () => {
  try {
    // Get all sales reps
    const salesRepsParams = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted_c" } },
        { field: { Name: "meetings_booked_c" } },
        { field: { Name: "deals_closed_c" } },
        { field: { Name: "total_revenue_c" } }
      ],
      pagingInfo: { limit: 100, offset: 0 }
    };

    const salesRepsResponse = await apperClient.fetchRecords('sales_rep_c', salesRepsParams);
    
    if (!salesRepsResponse.success) {
      console.error(salesRepsResponse.message);
      return [];
    }

    const salesReps = salesRepsResponse.data || [];
    const userStats = [];

    // For each sales rep, get their performance metrics
    for (const rep of salesReps) {
      try {
        const todayMetrics = await getLeadsAnalytics('today', rep.Id.toString());
        const weekMetrics = await getLeadsAnalytics('week', rep.Id.toString());
        const monthMetrics = await getLeadsAnalytics('month', rep.Id.toString());
        const allMetrics = await getLeadsAnalytics('all', rep.Id.toString());

        userStats.push({
          ...rep,
          totalLeads: allMetrics.totalCount,
          todayLeads: todayMetrics.totalCount,
          weekLeads: weekMetrics.totalCount,
          monthLeads: monthMetrics.totalCount,
          conversionRate: rep.meetings_booked_c > 0 ? 
            Math.round((rep.deals_closed_c / rep.meetings_booked_c) * 100) : 0
        });
      } catch (error) {
        console.error(`Error getting performance for rep ${rep.Id}:`, error);
        userStats.push({
          ...rep,
          totalLeads: 0,
          todayLeads: 0,
          weekLeads: 0,
          monthLeads: 0,
          conversionRate: 0
        });
      }
    }

    return userStats.sort((a, b) => b.totalLeads - a.totalLeads);
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching user performance:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return [];
  }
};

// Helper function to get date filter for different periods
const getDateFilterForPeriod = (period) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'yesterday':
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    default:
      return null;
  }

  return {
    FieldName: "created_at_c",
    Operator: "Between",
    Values: [startDate.toISOString(), endDate.toISOString()]
  };
};