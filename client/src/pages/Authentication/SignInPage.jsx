import React from 'react'
import { SignIn } from "@clerk/clerk-react";
import { Container, Paper } from '@mantine/core';

const SignInPage = () => {
  return (
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper shadow="md" p="xl" style={{ width: '100%' }}>
        <SignIn 
          fallbackRedirectUrl={'/dashboard'}
        />
      </Paper>
    </Container>
  );
};

export default SignInPage;
