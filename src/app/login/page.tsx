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

  // OTP step
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpInfo, setOtpInfo] = useState(''); // info message shown after OTP is sent
  const [otpLoading, setOtpLoading] = useState(false);

  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY || 'ROADTOSDET';

  // ── Shared: fetch user profile then store & redirect ─────────────────────
  const completeLogin = async (token: string) => {
    const isEmail = email.includes('@');
    const encodedValue = encodeURIComponent(email);

    let user;
    if (isEmail) {
      const resp = await axios.get(`${apiUrl}/user/search/email/${encodedValue}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-AUTH-SECRET-KEY': secretKey },
      });
      user = resp.data.user;
    } else {
      const resp = await axios.get(`${apiUrl}/user/search/phonenumber/${encodedValue}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-AUTH-SECRET-KEY': secretKey },
      });
      user = resp.data.user;
    }

    console.log('User data received:', user);

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('email', user.email);
      localStorage.setItem('userId', user.id?.toString() || '');
      localStorage.setItem('phoneNumber', user.phone_number);
      localStorage.setItem('photo', user.photo || '');
      localStorage.setItem('balance', user.balance?.toString() || '0');
      document.cookie = `token=${token}; path=/; max-age=86400`;
    }

    setTimeout(() => router.replace('/profile'), 100);
  };

  // ── Step 1: Verify credentials ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    if (!email || !password) {
      setValidationError('Email/Phone Number and Password cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const loginResponse = await axios.post(`${apiUrl}/user/login`, { email, password });

      // Admin: direct JWT — complete login immediately
      if (loginResponse.data.token) {
        await completeLogin(loginResponse.data.token);
        return;
      }

      // Customer / Agent / Merchant: OTP required
      if (loginResponse.data.otpRequired) {
        setOtpInfo(loginResponse.data.message || 'OTP sent to your registered email address.');
        setOtpRequired(true);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Login failed. Please input correct email/phone number or password.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please ensure the backend API is running.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const verifyResponse = await axios.post(`${apiUrl}/user/verify-otp`, {
        identifier: email,
        otp: otp,
      });

      await completeLogin(verifyResponse.data.token);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Go back to credentials step ───────────────────────────────────────────
  const handleBack = () => {
    setOtpRequired(false);
    setOtp('');
    setOtpInfo('');
    setError('');
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

        <Paper
          elevation={3}
          sx={{ padding: 4, width: '100%', borderRadius: 2, textAlign: 'center' }}
        >
          <Typography component="h1" variant="h5" sx={{ marginBottom: 2 }}>
            D-Money Login
          </Typography>

          {validationError && (
            <Alert severity="warning" sx={{ marginBottom: 2 }}>{validationError}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>
          )}

          {/* ── Step 1: Credentials ─────────────────────────────────────── */}
          {!otpRequired && (
            <>
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?{' '}
                  <span
                    onClick={() => router.push('/register')}
                    style={{ color: '#1976d2', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Register here
                  </span>
                </Typography>
              </Box>
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
                  sx={{ marginTop: 2, height: 48, fontSize: '16px', fontWeight: 'bold' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={16} sx={{ color: '#fff', marginRight: 1 }} />
                      Verifying…
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </Box>
            </>
          )}

          {/* ── Step 2: OTP ─────────────────────────────────────────────── */}
          {otpRequired && (
            <>
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                {otpInfo}
              </Alert>
              <Box component="form" onSubmit={handleVerifyOtp} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    // Allow only digits, max 4
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setOtp(val);
                  }}
                  inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                  placeholder="4-digit OTP"
                  sx={{ marginBottom: 2 }}
                  helperText="Check your registered email for the OTP. Valid for 2 minutes."
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ height: 48, fontSize: '16px', fontWeight: 'bold' }}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ color: '#fff', marginRight: 1 }} />
                      Verifying OTP…
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 1 }}
                  onClick={handleBack}
                  disabled={otpLoading}
                >
                  ← Back to Login
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
