import { create } from 'zustand';

export const useStore = create((set) => ({
  token: null,
  userDoc: null,
  user:null,
  shipments: [],
  notifications: [],
  setAuth: (token, userDoc,user) => set({ token, userDoc,user }),
  clearAuth: () => set({ token: null, email: null }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
    
  setShipments: (shipments) => set({ shipments }),
  addShipment: (shipment) =>
    set((state) => ({
      shipments: [...state.shipments, shipment],
    })),
    removeShipment: (id) =>
      set((state) => ({
        shipments: state.shipments.filter((shipment) => shipment._id !== id), 
      })),
}));



export default useStore;
