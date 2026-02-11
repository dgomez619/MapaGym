import axiosClient from './axiosClient';

export const getMyProfile = async () => {
  try {
    const token = localStorage.getItem('gymFinderToken');
    
    // DEBUG 1: Do we have a token?
    console.log("🔍 Debug - Token found:", token ? "YES" : "NO");
    
    if (!token) return null;

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // DEBUG 2: Making the request
    console.log("🚀 Debug - Fetching profile from /api/auth/me...");
    
    const response = await axiosClient.get('/api/auth/me', config);
    
    // DEBUG 3: What did the server send back?
    console.log("✅ Debug - Server Response:", response.data);

    return response.data.data;
  } catch (error) {
    // DEBUG 4: Did it fail?
    const err = error as any;
    console.error("❌ Debug - Error fetching profile:", err.response?.data || err.message);
    return null;
  }
};