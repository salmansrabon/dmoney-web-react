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

export default function CashIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer: '',
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

      const response = await API.post('/transaction/deposit', {
        from_account: phoneNumber,
        to_account: formData.customer,
        amount: Number(formData.amount),
      });

      setSuccess(response.data.message || 'Cash in successful!');
      setFormData({
        customer: '',
        amount: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process cash in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Cash In
        </Typography>

        <Paper sx={{ p: 3, mt: 3, maxWidth: 600 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Customer Phone Number"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                required
                placeholder="Enter customer's phone number"
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
                {loading ? 'Processing...' : 'Cash In'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}
