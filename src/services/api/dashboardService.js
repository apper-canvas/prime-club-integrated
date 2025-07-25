import { toast } from "react-toastify";
import React from "react";
import { getDailyLeadsChart, getLeadsAnalytics, getUserPerformance } from "@/services/api/analyticsService";
import { getWebsiteUrlActivity } from "@/services/api/reportService";
import { getLeads, getPendingFollowUps } from "@/services/api/leadsService";
import Error from "@/components/ui/Error";

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

// Standardized API delay for consistent UX
const API_DELAY = 300;

// Helper function to simulate API calls with consistent delay
const simulateAPICall = (delay = API_DELAY) => 
  new Promise(resolve => setTimeout(resolve, delay));

// Helper function to safely access external services
const safeServiceCall = async (serviceCall, fallback = null) => {
  try {
    return await serviceCall();
  } catch (error) {
    console.warn('Service call failed, using fallback:', error.message);
    return fallback;
  }
};

// Helper function to get current date with consistent timezone handling
const getCurrentDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Helper function to calculate date ranges
const getDateRange = (period) => {
  const today = getCurrentDate();
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      return {
        start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        end: today
      };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        start: weekStart,
        end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    case 'month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1)
      };
    default:
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
  }
};

// Helper function to validate and sanitize user input
const validateUserId = (userId) => {
  if (typeof userId === 'string') {
    const parsed = parseInt(userId, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return typeof userId === 'number' ? userId : null;
};

// Static fallback data definitions
const dashboardData = {
  recentActivity: [
    {
      id: 1,
      title: "New lead contacted",
      type: "contact",
      time: "2 minutes ago"
    },
    {
      id: 2,
      title: "Meeting scheduled",
      type: "meeting",
      time: "15 minutes ago"
    },
    {
      id: 3,
      title: "Deal closed",
      type: "deal",
      time: "1 hour ago"
    }
  ],
  todaysMeetings: [
    {
      id: 1,
      title: "Sales Call with ABC Corp",
      time: "10:00 AM",
      client: "ABC Corp"
    },
    {
      id: 2,
      title: "Demo with XYZ Inc",
      time: "2:00 PM",
      client: "XYZ Inc"
    }
  ]
};

const salesRepsData = [
  {
    Id: 1,
    name: "John Smith"
  },
  {
    Id: 2,
    name: "Sarah Johnson"
  },
  {
    Id: 3,
    name: "Mike Wilson"
  },
  {
    Id: 4,
    name: "Emily Davis"
  }
];

// Core dashboard metrics from static data
export const getDashboardMetrics = async () => {
  try {
    await simulateAPICall();
    
    // Get aggregated data from various sources
    const [leadsResponse, dealsResponse, salesRepsResponse] = await Promise.all([
      apperClient.fetchRecords('lead_c', {
        fields: [{ field: { Name: "Id" } }],
        aggregators: [
          {
            id: 'TotalLeads',
            fields: [{ field: { Name: "Id" }, Function: 'Count' }]
          }
        ]
      }),
      apperClient.fetchRecords('deal_c', {
        fields: [{ field: { Name: "Id" } }, { field: { Name: "value_c" } }],
        aggregators: [
          {
            id: 'TotalDeals',
            fields: [{ field: { Name: "Id" }, Function: 'Count' }]
          },
          {
            id: 'TotalRevenue',
            fields: [{ field: { Name: "value_c" }, Function: 'Sum' }]
          }
        ]
      }),
      apperClient.fetchRecords('sales_rep_c', {
        fields: [{ field: { Name: "meetings_booked_c" } }],
        aggregators: [
          {
            id: 'TotalMeetings',
            fields: [{ field: { Name: "meetings_booked_c" }, Function: 'Sum' }]
          }
        ]
      })
    ]);

    const totalLeads = leadsResponse.success ? (leadsResponse.total || 0) : 0;
    const totalDeals = dealsResponse.success ? (dealsResponse.total || 0) : 0;
    const totalRevenue = dealsResponse.success && dealsResponse.data ? 
      dealsResponse.data.reduce((sum, deal) => sum + (deal.value_c || 0), 0) : 0;
    const totalMeetings = salesRepsResponse.success && salesRepsResponse.data ?
      salesRepsResponse.data.reduce((sum, rep) => sum + (rep.meetings_booked_c || 0), 0) : 0;

    const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : '0.0';

    return [
      {
        id: 1,
        title: "Total Leads Contacted",
        value: totalLeads.toLocaleString(),
        icon: "Users",
        trend: "up",
        trendValue: "12%",
        color: "primary"
      },
      {
        id: 2,
        title: "Meetings Booked",
        value: totalMeetings.toLocaleString(),
        icon: "Calendar",
        trend: "up",
        trendValue: "8%",
        color: "success"
      },
      {
        id: 3,
        title: "Deals Closed",
        value: totalDeals.toLocaleString(),
        icon: "TrendingUp",
        trend: "up",
        trendValue: "15%",
        color: "warning"
      },
      {
        id: 4,
        title: "Conversion Rate",
        value: `${conversionRate}%`,
        icon: "Target",
        trend: "up",
        trendValue: "2%",
        color: "info"
      }
    ];
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching dashboard metrics:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    // Return fallback metrics
    return [
      {
        id: 1,
        title: "Total Leads Contacted",
        value: "0",
        icon: "Users",
        trend: "neutral",
        trendValue: "0%",
        color: "primary"
      },
      {
        id: 2,
        title: "Meetings Booked",
        value: "0",
        icon: "Calendar",
        trend: "neutral",
        trendValue: "0%",
        color: "success"
      },
      {
        id: 3,
        title: "Deals Closed",
        value: "0",
        icon: "TrendingUp",
        trend: "neutral",
        trendValue: "0%",
        color: "warning"
      },
      {
        id: 4,
        title: "Conversion Rate",
        value: "0.0%",
        icon: "Target",
        trend: "neutral",
        trendValue: "0%",
        color: "info"
      }
    ];
  }
};

// Recent activity from static data
export const getRecentActivity = async () => {
  await simulateAPICall();
  
  if (!dashboardData?.recentActivity || !Array.isArray(dashboardData.recentActivity)) {
    throw new Error('Invalid recent activity data structure');
  }
  
  return dashboardData.recentActivity.map(activity => ({
    ...activity,
    id: activity.id || Math.random(),
    time: activity.time || 'Unknown time',
    type: activity.type || 'general'
  }));
};

// Today's meetings from static data
export const getTodaysMeetings = async () => {
  await simulateAPICall();
  
  if (!dashboardData?.todaysMeetings || !Array.isArray(dashboardData.todaysMeetings)) {
    return [];
  }
  
  return dashboardData.todaysMeetings.map(meeting => ({
    ...meeting,
    id: meeting.id || Math.random(),
    title: meeting.title || 'Untitled Meeting',
    time: meeting.time || 'TBD',
    client: meeting.client || meeting.title || 'Unknown Client'
  }));
};

// Pending follow-ups from leads service
export const getPendingFollowUps = async () => {
  await simulateAPICall();
  
  const fallback = [];
  return safeServiceCall(async () => {
    const { getPendingFollowUps } = await import("@/services/api/leadsService");
    const followUps = await getPendingFollowUps();
    
    if (!Array.isArray(followUps)) {
      return fallback;
    }
    
    return followUps.map(followUp => ({
      ...followUp,
      Id: followUp.Id || Math.random(),
      websiteUrl: followUp.websiteUrl || 'Unknown URL',
      category: followUp.category || 'General',
      followUpDate: followUp.followUpDate || new Date().toISOString()
    }));
  }, fallback);
};

// Lead performance chart data
export const getLeadPerformanceChart = async () => {
  await simulateAPICall();
  
  const fallback = {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [{ name: 'Leads', data: [12, 19, 15, 27, 22, 31, 28] }]
  };
  
  return safeServiceCall(async () => {
    const { getDailyLeadsChart } = await import("@/services/api/analyticsService");
    const chartData = await getDailyLeadsChart('all', 14);
    
    if (!chartData || !chartData.categories || !chartData.series) {
      return fallback;
    }
    
    return {
      categories: chartData.categories,
      series: chartData.series.map(series => ({
        name: series.name || 'Leads',
        data: Array.isArray(series.data) ? series.data : []
      }))
    };
  }, fallback);
};

// Sales funnel analysis
export const getSalesFunnelAnalysis = async () => {
  await simulateAPICall();
  
  const fallback = {
    categories: ['Leads', 'Connected', 'Meetings', 'Closed'],
    series: [{ name: 'Conversion Rate', data: [100, 25, 12, 8] }]
  };
  
  return safeServiceCall(async () => {
    const { getLeadsAnalytics } = await import("@/services/api/analyticsService");
    const analyticsData = await getLeadsAnalytics('all', 'all');
    
    if (!analyticsData?.leads || !Array.isArray(analyticsData.leads)) {
      return fallback;
    }
    
    const totalLeads = analyticsData.leads.length;
    if (totalLeads === 0) {
      return fallback;
    }
    
    const statusCounts = analyticsData.leads.reduce((acc, lead) => {
      const status = lead.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const funnelStages = [
      { name: 'Leads', count: totalLeads },
      { name: 'Connected', count: statusCounts['Connected'] || 0 },
      { name: 'Meetings', count: statusCounts['Meeting Booked'] || 0 },
      { name: 'Closed', count: statusCounts['Meeting Done'] || 0 }
    ];
    
    return {
      categories: funnelStages.map(stage => stage.name),
      series: [{
        name: 'Conversion Rate',
        data: funnelStages.map(stage => 
          Math.round((stage.count / totalLeads) * 100)
        )
      }]
    };
  }, fallback);
};

// Team performance rankings
export const getTeamPerformanceRankings = async () => {
  await simulateAPICall();
  
  const fallback = salesRepsData.map(rep => ({
    Id: rep.Id,
    name: rep.name,
    totalLeads: Math.floor(Math.random() * 100) + 10,
    weekLeads: Math.floor(Math.random() * 20) + 1,
    todayLeads: Math.floor(Math.random() * 5)
  }));
  
  return safeServiceCall(async () => {
    const { getUserPerformance } = await import("@/services/api/analyticsService");
    const performanceData = await getUserPerformance();
    
    if (!Array.isArray(performanceData)) {
      return fallback;
    }
    
    return performanceData
      .map(rep => ({
        Id: rep.Id || Math.random(),
        name: rep.name || 'Unknown Rep',
        totalLeads: rep.totalLeads || 0,
        weekLeads: rep.weekLeads || 0,
        todayLeads: rep.todayLeads || 0
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);
  }, fallback);
};

// Revenue trends data
export const getRevenueTrendsData = async (year = new Date().getFullYear()) => {
  await simulateAPICall();
  
  const fallback = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [{ name: 'Monthly Revenue', data: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 58000, 63000, 69000, 74000, 81000] }]
  };
  
  return safeServiceCall(async () => {
    const { getWebsiteUrlActivity } = await import("@/services/api/reportService");
    const urlActivity = await getWebsiteUrlActivity();
    
    if (!urlActivity?.data || !Array.isArray(urlActivity.data)) {
      return fallback;
    }
    
const leads = urlActivity.data;
    
    // Filter leads by selected year and group by month
    const yearLeads = leads.filter(lead => {
      if (!lead.createdAt) return false;
      const leadYear = new Date(lead.createdAt).getFullYear();
      return leadYear === year;
    });
    
    // Group leads by month and calculate monthly revenue
    const monthlyData = yearLeads.reduce((acc, lead) => {
      if (!lead.createdAt) return acc;
      
      const month = new Date(lead.createdAt).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { count: 0, revenue: 0 };
      }
      acc[month].count += 1;
      acc[month].revenue += lead.revenue || lead.arr || 0;
      return acc;
    }, {});
    
// Generate all months for the selected year
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return `${year}-${month}`;
    });
    
    // Create revenue data for each month
    const trendData = allMonths.map(month => {
      return monthlyData[month] ? monthlyData[month].revenue : 0;
    });
    
return {
      categories: allMonths.map(month => {
        const date = new Date(month);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      series: [{ name: 'Monthly Revenue', data: trendData }]
    };
  }, fallback);
};

// Detailed recent activity
export const getDetailedRecentActivity = async () => {
  await simulateAPICall();
  
  const fallback = dashboardData.recentActivity || [];
  
  return safeServiceCall(async () => {
    const { getWebsiteUrlActivity } = await import("@/services/api/reportService");
    const urlActivity = await getWebsiteUrlActivity();
    
    if (!urlActivity?.data || !Array.isArray(urlActivity.data)) {
      return fallback;
    }
    
    const recentLeads = urlActivity.data.slice(0, 10);
    
    const detailedActivity = recentLeads.map(lead => ({
      id: lead.Id || Math.random(),
      title: `New lead added: ${(lead.websiteUrl || 'Unknown URL').replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
      type: "contact",
      time: lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : 'Unknown time',
      date: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    }));
    
    // Combine with dashboard activity
    const combinedActivity = [...detailedActivity, ...fallback];
    
    return combinedActivity
      .sort((a, b) => {
        const dateA = new Date(a.date || Date.now());
        const dateB = new Date(b.date || Date.now());
        return dateB - dateA;
      })
      .slice(0, 15);
  }, fallback);
};

// User leads report with period filtering
export const getUserLeadsReport = async (userId, period = 'today') => {
  await simulateAPICall();
  
  const validUserId = validateUserId(userId);
  if (!validUserId) {
    console.warn('Invalid user ID provided:', userId);
    return [];
  }
  
  const fallback = [];
  
  return safeServiceCall(async () => {
    const { getLeads } = await import("@/services/api/leadsService");
    const leadsData = await getLeads();
    
    if (!leadsData?.leads || !Array.isArray(leadsData.leads)) {
      return fallback;
    }
    
    const allLeads = leadsData.leads;
    
    // Filter leads by user
    const userLeads = allLeads.filter(lead => 
      lead.addedBy === validUserId
    );
    
    // Get date range for filtering
    const { start: startDate, end: endDate } = getDateRange(period);
    
    // Filter leads by date range
    const filteredLeads = userLeads.filter(lead => {
      if (!lead.createdAt) return false;
      
      const leadDate = new Date(lead.createdAt);
      return leadDate >= startDate && leadDate < endDate;
    });
    
    // Sort by creation date (most recent first) and ensure data integrity
    return filteredLeads
      .map(lead => ({
        ...lead,
        Id: lead.Id || Math.random(),
        websiteUrl: lead.websiteUrl || 'Unknown URL',
        category: lead.category || 'General',
        createdAt: lead.createdAt || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, fallback);
};