import axiosClient from './axiosClient';

// Helper to grab the token for secure requests
const getConfig = () => {
  const token = localStorage.getItem('gymFinderToken');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getAdminStats = async () => {
  try {
    const response = await axiosClient.get('/api/admin/stats', getConfig());
    return response.data.data;
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axiosClient.get('/api/admin/users', getConfig());
    return response.data.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const getAllGyms = async () => {
  try {
    const response = await axiosClient.get('/api/admin/gyms', getConfig());
    return response.data.data;
  } catch (error) {
    console.error("Error fetching gyms:", error);
    return [];
  }
};