import { toast } from 'react-toastify';

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const taskService = {
  async getAll() {
    try {
      await delay(300);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        orderBy: [{ fieldName: "created_at_c", sorttype: "DESC" }],
        pagingInfo: { limit: 1000, offset: 0 }
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async getById(id) {
    try {
      await delay(200);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ]
      };

      const response = await apperClient.getRecordById('task_c', parseInt(id), params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error('Task not found');
      }

      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw new Error('Task not found');
    }
  },

async create(taskData) {
    try {
      await delay(400);
      const params = {
        records: [
          {
            Name: taskData.Name || taskData.title_c,
            title_c: taskData.title_c,
            description_c: taskData.description_c,
            category_id_c: parseInt(taskData.category_id_c),
            priority_c: taskData.priority_c,
            due_date_c: taskData.due_date_c,
            completed_c: false,
            archived_c: false,
            created_at_c: new Date().toISOString(),
            completed_at_c: null
          }
        ]
      };

      const response = await apperClient.createRecord('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create task ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to create task");
        }
        
        const successfulRecord = response.results.find(result => result.success);
        if (successfulRecord) {
          toast.success("Task created successfully");
          return successfulRecord.data;
        }
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error creating task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

async update(id, updates) {
    try {
      await delay(300);
      const updateData = { ...updates };
      
      // Handle completion logic
      if (updateData.completed_c !== undefined) {
        updateData.completed_at_c = updateData.completed_c ? new Date().toISOString() : null;
      }
      
      // Format lookup fields
      if (updateData.category_id_c !== undefined) {
        updateData.category_id_c = parseInt(updateData.category_id_c);
      }

      const params = {
        records: [
          {
            Id: parseInt(id),
            ...updateData
          }
        ]
      };

      const response = await apperClient.updateRecord('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error('Task not found');
      }

      if (response.results) {
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update task ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          
          failedUpdates.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to update task");
        }
        
        const successfulUpdate = response.results.find(result => result.success);
        if (successfulUpdate) {
          toast.success("Task updated successfully");
          return successfulUpdate.data;
        }
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error updating task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

async delete(id) {
    try {
      await delay(250);
      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error('Task not found');
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete task ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to delete task");
        }
        
        toast.success("Task deleted successfully");
        return { success: true };
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error deleting task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

async getByCategory(categoryId) {
    try {
      await delay(300);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        where: [
          {
            FieldName: "category_id_c",
            Operator: "EqualTo",
            Values: [parseInt(categoryId)]
          }
        ],
        orderBy: [{ fieldName: "created_at_c", sorttype: "DESC" }]
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching tasks by category:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async search(query) {
    try {
      await delay(200);
      const searchTerm = query.toLowerCase();
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        whereGroups: [
          {
            operator: "OR",
            subGroups: [
              {
                conditions: [
                  {
                    fieldName: "title_c",
                    operator: "Contains",
                    values: [searchTerm]
                  }
                ],
                operator: "OR"
              },
              {
                conditions: [
                  {
                    fieldName: "description_c",
                    operator: "Contains",
                    values: [searchTerm]
                  }
                ],
                operator: "OR"
              }
            ]
          }
        ]
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error searching tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async getCompleted() {
    try {
      await delay(250);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        where: [
          {
            FieldName: "completed_c",
            Operator: "EqualTo",
            Values: [true]
          },
          {
            FieldName: "archived_c",
            Operator: "EqualTo",
            Values: [false]
          }
        ]
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching completed tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async getPending() {
    try {
      await delay(250);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        where: [
          {
            FieldName: "completed_c",
            Operator: "EqualTo",
            Values: [false]
          },
          {
            FieldName: "archived_c",
            Operator: "EqualTo",
            Values: [false]
          }
        ]
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching pending tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async getOverdue() {
    try {
      await delay(250);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        where: [
          {
            FieldName: "completed_c",
            Operator: "EqualTo",
            Values: [false]
          },
          {
            FieldName: "archived_c",
            Operator: "EqualTo",
            Values: [false]
          },
          {
            FieldName: "due_date_c",
            Operator: "LessThan",
            Values: [today.toISOString().split('T')[0]]
          }
        ]
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching overdue tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async getDueToday() {
    try {
      await delay(250);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "category_id_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "due_date_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "archived_c" } },
          { field: { Name: "created_at_c" } },
          { field: { Name: "completed_at_c" } }
        ],
        where: [
          {
            FieldName: "completed_c",
            Operator: "EqualTo",
            Values: [false]
          },
          {
            FieldName: "archived_c",
            Operator: "EqualTo",
            Values: [false]
          },
          {
            FieldName: "due_date_c",
            Operator: "EqualTo",
            Values: [todayStr]
          }
        ]
      };

      const response = await apperClient.fetchRecords('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching tasks due today:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async bulkDelete(ids) {
    try {
      await delay(500);
      const params = {
        RecordIds: ids.map(id => parseInt(id))
      };

      const response = await apperClient.deleteRecord('task_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        const successfulDeletions = response.results.filter(result => result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete tasks ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successfulDeletions.length > 0) {
          toast.success(`${successfulDeletions.length} tasks deleted successfully`);
        }
        
        return successfulDeletions.map(result => ({ Id: result.id, success: true }));
      } else {
        return [];
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error bulk deleting tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  }
}