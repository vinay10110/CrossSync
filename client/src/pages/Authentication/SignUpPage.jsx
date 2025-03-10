import React from 'react'
import { SignUp } from "@clerk/clerk-react";
import { Container, Paper } from '@mantine/core';

const SignUpPage = () => {
  return (
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper shadow="md" p="xl" style={{ width: '100%' }}>
        <SignUp 
        fallbackRedirectUrl={'/auth/role-selection'}
        />
      </Paper>
    </Container>
  );
};

export default SignUpPage;
