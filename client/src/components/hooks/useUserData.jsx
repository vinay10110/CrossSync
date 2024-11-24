/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../../components/Supabase';
import { showNotification } from '@mantine/notifications';
import { IconTruckDelivery } from '@tabler/icons-react';

export const useUserData = (setAuth) => {
  const [userEmail, setUserEmail] = useState(null);
  const [fullUser, setFullUser] = useState(null);
  const [token, setToken] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        return;
      }
      
      if (data.session) {
        const user = data.session.user;
        setFullUser(user);
        setUserEmail(user.email);
        const accessToken = data.session.access_token;
        setToken(accessToken);

        const now = new Date();
        const createdAt = new Date(user.created_at);
        if (now - createdAt < 10000) {
          setIsFirstLogin(true);
          
        } else {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/getUser`, {
            method: 'POST',
            body: JSON.stringify({ email: user.email }),
            headers: { 'Content-Type': 'application/json' },
          });
          const result = await response.json();
          setAuth(accessToken, result[0], user);
        }
      }
    };

    const initializeSocketConnection = () => {
      if (userEmail) {
        const socketConnection = io(`${import.meta.env.VITE_API_URL}`, {
          query: { email: fullUser.email },
        });


        socketConnection.on('connect', () => {
          console.log(`Connected with socket ID: ${socketConnection.id}`);
        });

        socketConnection.on('shipmentUpdate', (data) => {
          showNotification({
            title: 'Shipment Update',
            message: data.message,
            color: 'blue',
            autoClose: 5000,
            icon: <IconTruckDelivery size={18} />,
            radius: 'md',
          });
         
        });
        
        return () => {
          if (socketConnection) {
            socketConnection.off('shipmentUpdate'); 
            socketConnection.disconnect(); 
            console.log('Socket disconnected');
          }
        };
      }
    };

    fetchUserData();
    initializeSocketConnection();
  }, [setAuth, userEmail]);

  return { userEmail, fullUser, token, isFirstLogin, setIsFirstLogin, };
};
