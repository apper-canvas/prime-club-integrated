import { toast } from "react-toastify";

// Initialize ApperClient
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const categoryService = {
  async getAll() {
    try {
      await delay(200);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "color_c" } },
          { field: { Name: "icon_c" } },
          { field: { Name: "task_count_c" } }
        ],
        orderBy: [{ fieldName: "Name", sorttype: "ASC" }],
        pagingInfo: { limit: 100, offset: 0 }
      };

      const response = await apperClient.fetchRecords('category_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching categories:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

async getById(id) {
    try {
      await delay(150);
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "color_c" } },
          { field: { Name: "icon_c" } },
          { field: { Name: "task_count_c" } }
        ]
      };

      const response = await apperClient.getRecordById('category_c', parseInt(id), params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error('Category not found');
      }

      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching category:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw new Error('Category not found');
    }
  },

async create(categoryData) {
    try {
      await delay(300);
      const params = {
        records: [
          {
            Name: categoryData.Name,
            color_c: categoryData.color_c,
            icon_c: categoryData.icon_c,
            task_count_c: 0
          }
        ]
      };

      const response = await apperClient.createRecord('category_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create category ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to create category");
        }
        
        const successfulRecord = response.results.find(result => result.success);
        if (successfulRecord) {
          toast.success("Category created successfully");
          return successfulRecord.data;
        }
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error creating category:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },
async update(id, updates) {
    try {
      await delay(250);
      const params = {
        records: [
          {
            Id: parseInt(id),
            ...updates
          }
        ]
      };

      const response = await apperClient.updateRecord('category_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error('Category not found');
      }

      if (response.results) {
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update category ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          
          failedUpdates.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to update category");
        }
        
        const successfulUpdate = response.results.find(result => result.success);
        if (successfulUpdate) {
          toast.success("Category updated successfully");
          return successfulUpdate.data;
        }
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error updating category:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

async delete(id) {
    try {
      await delay(200);
      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord('category_c', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error('Category not found');
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete category ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to delete category");
        }
        
        toast.success("Category deleted successfully");
        return { success: true };
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error deleting category:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

async updateTaskCount(categoryId, count) {
    try {
      await delay(100);
      return await this.update(categoryId, { task_count_c: parseInt(count) });
    } catch (error) {
      console.error("Error updating task count:", error.message);
      return null;
    }
  }
}