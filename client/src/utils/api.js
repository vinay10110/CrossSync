const API_BASE_URL = import.meta.env.VITE_API_URL;

// Carrier Profile API functions
export const getCarrierProfile = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/carriers/profile/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty profile if not found
        return {
          companyName: '',
          registrationNumber: '',
          taxId: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          phone: '',
          email: '',
          website: '',
          description: '',
          fleetSize: '',
          vehicleTypes: [],
          specializations: [],
          certifications: [],
          operatingRegions: [],
          insuranceProvider: '',
          insuranceNumber: '',
          insuranceExpiry: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          logo: null,
          documents: []
        };
      }
      throw new Error(`Failed to fetch carrier profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.profile || data;
  } catch (error) {
    console.error('Error in getCarrierProfile:', error);
    throw error;
  }
};

export const updateCarrierProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/carriers/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update carrier profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in updateCarrierProfile:', error);
    throw error;
  }
};

// Seller Profile API functions (for future use)
export const getSellerProfile = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sellers/profile/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {}; // Return empty profile if not found
      }
      throw new Error(`Failed to fetch seller profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.profile || data;
  } catch (error) {
    console.error('Error in getSellerProfile:', error);
    throw error;
  }
};

export const updateSellerProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sellers/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update seller profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in updateSellerProfile:', error);
    throw error;
  }
};
