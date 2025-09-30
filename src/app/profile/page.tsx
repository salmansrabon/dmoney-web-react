'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
} from '@mui/material';

interface User {
  id?: number;
  name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  nid?: string;
  createdAt?: string;
  balance?: number;
}

export default function Profile() {
  const [user, setUser] = useState<User>({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<User>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');

      if (!token) {
        router.replace('/login');
        return;
      }

      if (!email) {
        console.error('No email found in localStorage');
        setLoading(false);
        return;
      }

      try {
        const response = await API.get(`/user/search/email/${email}`);
        setUser(response.data.user);
        setFormData(response.data.user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleEdit = () => {
    setFormData({ ...user });
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({ ...user });
    setEditMode(false);
  };

  const handleChange = (field: keyof User, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!formData.id) return;

    try {
      setSaveLoading(true);
      await API.patch(`/user/update/${formData.id}`, {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        nid: formData.nid,
      });

      setSnackbarMessage('Profile updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setUser(formData);
      setEditMode(false);
      
      // Update localStorage with new email if changed
      if (formData.email) {
        localStorage.setItem('email', formData.email);
      }
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to update profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ padding: 3, width: '80%', maxWidth: 600 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">User Profile</Typography>
            {!editMode ? (
              <Button variant="contained" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? <CircularProgress size={24} /> : 'Save'}
                </Button>
                <Button variant="outlined" onClick={handleCancel} disabled={saveLoading}>
                  Cancel
                </Button>
              </Box>
            )}
          </Box>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!editMode}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!editMode}
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone_number || ''}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              disabled={!editMode}
              required
            />
            <TextField
              fullWidth
              label="NID"
              value={formData.nid || ''}
              onChange={(e) => handleChange('nid', e.target.value)}
              disabled={!editMode}
            />
            <TextField
              fullWidth
              label="Role"
              value={formData.role || ''}
              disabled
              InputProps={{ readOnly: true }}
            />
            {formData.createdAt && (
              <TextField
                fullWidth
                label="Registration Date"
                value={new Date(formData.createdAt).toLocaleDateString()}
                disabled
                InputProps={{ readOnly: true }}
              />
            )}
            {typeof formData.balance === 'number' && (
              <TextField
                fullWidth
                label="Balance"
                value={formData.balance.toFixed(2)}
                disabled
                InputProps={{ readOnly: true }}
              />
            )}
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
