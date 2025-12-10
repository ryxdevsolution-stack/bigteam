import api from './api';

export interface Package {
  id: string;
  name: string;
  amount: number;
  commission_percentage: number;
  description: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export interface CreatePackageData {
  name: string;
  amount: number;
  commission_percentage: number;
  description?: string;
}

export interface UpdatePackageData {
  name?: string;
  amount?: number;
  commission_percentage?: number;
  description?: string;
}

const packageService = {
  // Admin: Get all packages (includes deleted if specified)
  getAllPackages: async (includeDeleted: boolean = false): Promise<Package[]> => {
    const response = await api.get('/api/admin/packages', {
      params: { include_deleted: includeDeleted }
    });
    return response.data.data;
  },

  // Admin: Get active packages only
  getActivePackagesAdmin: async (): Promise<Package[]> => {
    const response = await api.get('/api/admin/packages/active');
    return response.data.data;
  },

  // Admin: Get single package by ID
  getPackageById: async (packageId: string): Promise<Package> => {
    const response = await api.get(`/api/admin/packages/${packageId}`);
    return response.data.data;
  },

  // Admin: Create new package
  createPackage: async (data: CreatePackageData): Promise<Package> => {
    const response = await api.post('/api/admin/packages', data);
    return response.data.data;
  },

  // Admin: Update package
  updatePackage: async (packageId: string, data: UpdatePackageData): Promise<Package> => {
    const response = await api.put(`/api/admin/packages/${packageId}`, data);
    return response.data.data;
  },

  // Admin: Delete package (soft delete)
  deletePackage: async (packageId: string): Promise<void> => {
    await api.delete(`/api/admin/packages/${packageId}`);
  },

  // Admin: Toggle package active status
  togglePackageStatus: async (packageId: string): Promise<Package> => {
    const response = await api.patch(`/api/admin/packages/${packageId}/toggle`);
    return response.data.data;
  },

  // User: Get active packages for activation selection
  getPackagesForUser: async (): Promise<Package[]> => {
    const response = await api.get('/api/packages');
    return response.data.data;
  }
};

export default packageService;
