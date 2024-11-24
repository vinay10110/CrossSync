import { useEffect } from 'react';

export const useFetchShipments = (setShipments) => {
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/shipments/shipments`);
        if (!response.ok) {
          console.error('Failed to fetch shipments');
          return;
        }
        const allShipments = await response.json();
        setShipments(allShipments);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      }
    };

    fetchShipments();
  }, [setShipments]);
};
