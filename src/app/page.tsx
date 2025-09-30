'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // User is logged in, redirect to profile
      router.replace('/profile');
    } else {
      // User is not logged in, redirect to login
      router.replace('/login');
    }
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <CircularProgress size={60} sx={{ mb: 2, color: 'primary.main' }} />
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Redirecting...
      </Typography>
    </Box>
  );
}
