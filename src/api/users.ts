import apiClient from './client';
import type { User, Role } from '../types';

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: string;
  organization_id?: string | null;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role_id?: string;
  organization_id?: string | null;
  is_active?: boolean;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: string;
  organization_id?: string;
  is_active?: boolean;
}

export interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all users with pagination
export const getUsers = async (params?: GetUsersParams): Promise<UsersResponse> => {
  const { data } = await apiClient.get('/users', { params });
  return data;
};

// Get user by ID
export const getUser = async (id: string): Promise<User> => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data.user;
};

// Create user
export const createUser = async (payload: CreateUserRequest): Promise<User> => {
  const { data } = await apiClient.post('/users', payload);
  return data.user;
};

// Update user
export const updateUser = async (id: string, payload: UpdateUserRequest): Promise<User> => {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data.user;
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

// Get all roles (for dropdowns)
export const getRoles = async (): Promise<Role[]> => {
  const { data } = await apiClient.get('/users/roles');
  return data.roles;
};
