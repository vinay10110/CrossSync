/* eslint-disable no-unused-vars */
import { supabase } from '../../components/Supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Container, Flex, Paper, Box } from '@mantine/core';
import img from "../../assets/image1.jpeg";

const Authentication = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate('/dashboard');
      } else if (event === "SIGNED_OUT") {
        navigate('/');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div>
      <Container
        style={{
          display: 'flex',
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 0, 
          minHeight: '100vh', 
        }}
      >
       
        <Flex
          direction={{ base: 'column', sm: 'row' }} 
          align="stretch" 
          justify="center"
          wrap="nowrap" 
          style={{
            width: 'auto',
          }}
        >
         
          <Paper
            shadow="md" 
            p="xl" 
            withBorder
            style={{
              flex: 1,
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    background: '#228BE6', 
                    color: 'white', 
                  },
                },
              }}
              theme="dark"
              providers={['google']}
            />
          </Paper>

          {/* Image */}
          <Box
            style={{
              flex: 1,
              maxWidth: '100%',
            }}
          >
            <img
              src={img}
              alt="Panda"
              style={{
                width: '100%',
                height: '100%', 
                objectFit: 'cover', 
                maxHeight: '600px', 
              }}
            />
          </Box>
        </Flex>
      </Container>
    </div>
  );
};

export default Authentication;
