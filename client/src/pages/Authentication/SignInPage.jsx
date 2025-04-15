import React from 'react'
import { Container, Paper, ActionIcon } from '@mantine/core';
import { SignIn } from "@clerk/clerk-react";
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const navigate = useNavigate();

  return (
    <Container size="sm" style={{ minHeight: '100vh' }}>
      <ActionIcon
        variant="subtle"
        size="xl"
        style={{ position: 'absolute', top: 20, left: 20 }}
        onClick={() => navigate('/')}
      >
        <IconArrowLeft size={24} />
      </ActionIcon>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        
          <SignIn fallbackRedirectUrl={'/dashboard'} />
        
      </div>
    </Container>
  );
};

export default SignInPage;
