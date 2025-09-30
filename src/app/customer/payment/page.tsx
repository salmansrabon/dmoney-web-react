'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Stack,
} from '@mui/material';

export default function Payment() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const phoneNumber = localStorage.getItem('phoneNumber');
      
      if (!phoneNumber) {
        setError('Phone number not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await API.post('/transaction/payment', {
        from_account: phoneNumber,
        to_account: formData.merchant,
        amount: Number(formData.amount),
      });

      setSuccess(response.data.message || 'Payment successful!');
      setFormData({
        merchant: '',
        amount: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Make Payment
        </Typography>

        <Paper sx={{ p: 3, mt: 3, maxWidth: 600 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Merchant Phone Number"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                required
                placeholder="Enter merchant's phone number"
              />

              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                inputProps={{ min: 1, step: 0.01 }}
                placeholder="Enter amount"
              />

              {error && <Alert severity="error">{error}</Alert>}

              {success && <Alert severity="success">{success}</Alert>}

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
              >
                {loading ? 'Processing...' : 'Make Payment'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}
