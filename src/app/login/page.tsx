'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Front-end validation for empty fields
    if (!email || !password) {
      setValidationError('Email/Phone Number and Password cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      // Debug: Log API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('API URL:', apiUrl);
      console.log('Attempting login with:', email);

      // Step 1: Authenticate user (email property accepts both email and phone number)
      const loginResponse = await axios.post(
        `${apiUrl}/user/login`,
        { email, password }
      );

      const token = loginResponse.data.token;

      // Step 2: Fetch user details using email or phone number
      const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY || 'ROADTOSDET';
      
      // Determine if input is email or phone number
      const isEmail = email.includes('@');
      const encodedValue = encodeURIComponent(email);
      
      let user;
      if (isEmail) {
        // Search by email
        const emailSearchResponse = await axios.get(
          `${apiUrl}/user/search/email/${encodedValue}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-AUTH-SECRET-KEY': secretKey,
            },
          }
        );
        user = emailSearchResponse.data.user;
      } else {
        // Search by phone number
        const phoneSearchResponse = await axios.get(
          `${apiUrl}/user/search/phonenumber/${encodedValue}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-AUTH-SECRET-KEY': secretKey,
            },
          }
        );
        user = phoneSearchResponse.data.user;
      }
      
      console.log('User data received:', user);

      // Step 3: Store token and user details in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('email', user.email);
        localStorage.setItem('userId', user.id?.toString() || '');
        localStorage.setItem('phoneNumber', user.phone_number);
        localStorage.setItem('photo', user.photo || '');
        localStorage.setItem('balance', user.balance?.toString() || '0');
        
        // Also set token as a cookie for middleware
        document.cookie = `token=${token}; path=/; max-age=86400`; // 24 hours
        
        console.log('Data stored in localStorage and cookie');
        console.log('Token:', localStorage.getItem('token'));
        console.log('Role:', localStorage.getItem('role'));
      }

      // Navigate to profile
      console.log('Attempting to navigate to /profile');
      router.push('/profile');
      console.log('router.push called');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 400)
      ) {
        setError('Login failed. Please input correct email/phone number or password.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please ensure the backend API is running at http://localhost:3000');
      } else {
        setError(
          err.response?.data?.message || 'Login failed. Please try again or check if the backend API is running.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ marginBottom: 4 }}>
          <img
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            style={{ display: 'block' }}
          />
        </Box>

        {/* Paper container for better styling */}
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ marginBottom: 2 }}>
            D-Money Login
          </Typography>
          {validationError && (
            <Alert severity="warning" sx={{ marginBottom: 2 }}>
              {validationError}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleLogin} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email or Phone Number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email or phone number"
              sx={{ marginBottom: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ marginBottom: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                marginTop: 2,
                height: 48,
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ color: '#fff', marginRight: 1 }} />
                  Please wait...verifying your credentials
                </>
              ) : (
                'Login'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
