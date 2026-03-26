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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Stack,
  Link,
} from '@mui/material';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    nid: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone_number || !formData.nid || !formData.role) {
      setError('All fields are required.');
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Only Gmail addresses (@gmail.com) are allowed for registration.');
      return;
    }

    if (formData.phone_number.length !== 11) {
      setError('Phone number must be exactly 11 digits.');
      return;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await axios.post(`${apiUrl}/user/register`, formData);

      setSuccess(
        response.data.message ||
          'Registration successful! Your account is pending admin approval. You can now login.'
      );

      // Clear form
      setFormData({ name: '', email: '', password: '', phone_number: '', nid: '', role: '' });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.status === 208) {
        setError(err.response.data.message || 'Account already exists with this email or phone number.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ marginBottom: 3 }}>
          <img
            src="/logo.png"
            alt="DMoney Logo"
            width={80}
            height={80}
            style={{ display: 'block' }}
          />
        </Box>

        <Paper elevation={3} sx={{ padding: 4, width: '100%', borderRadius: 2 }}>
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            Create a DMoney Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                fullWidth
                required
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                inputProps={{ minLength: 3, maxLength: 50 }}
                disabled={loading}
              />

              <TextField
                fullWidth
                required
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="yourname@gmail.com"
                helperText="Only Gmail addresses (@gmail.com) are accepted"
                disabled={loading}
              />

              <TextField
                fullWidth
                required
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 4 characters"
                disabled={loading}
              />

              <TextField
                fullWidth
                required
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="11-digit phone number (e.g. 01XXXXXXXXX)"
                inputProps={{ maxLength: 11 }}
                disabled={loading}
              />

              <TextField
                fullWidth
                required
                label="National ID (NID)"
                name="nid"
                value={formData.nid}
                onChange={handleChange}
                placeholder="7–13 digit NID number"
                inputProps={{ minLength: 7, maxLength: 13 }}
                disabled={loading}
              />

              <FormControl fullWidth required>
                <InputLabel>Account Type (Role)</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleRoleChange}
                  label="Account Type (Role)"
                  disabled={loading}
                >
                  <MenuItem value="Customer">Customer</MenuItem>
                  <MenuItem value="Agent">Agent</MenuItem>
                  <MenuItem value="Merchant">Merchant</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mt: 1 }}>
                After registration, your account will be <strong>pending</strong> approval. An admin
                will activate your account before you can perform transactions.
              </Alert>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 1, height: 48, fontSize: '16px', fontWeight: 'bold' }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => router.push('/login')}
                    sx={{ cursor: 'pointer' }}
                  >
                    Login here
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
