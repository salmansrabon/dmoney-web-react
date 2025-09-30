'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import API from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Stack,
} from '@mui/material';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  nid: string;
  role: string;
  balance?: number;
}

export default function UserProfile() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<UserData | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/user/search/id/${userId}`);
      setUser(response.data.user);
      setFormData(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setFormData({ ...user! });
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({ ...user! });
    setEditMode(false);
  };

  const handleChange = (field: keyof UserData, value: string) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setSaveLoading(true);
      await API.patch(`/user/update/${userId}`, {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        nid: formData.nid,
        role: formData.role,
      });

      setSnackbarMessage('User updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setUser(formData);
      setEditMode(false);
      fetchUserProfile();
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to update user');
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Box>
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={() => router.push('/admin/users')} sx={{ mt: 2 }}>
            Back to User List
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  if (!user || !formData) {
    return (
      <DashboardLayout>
        <Box>
          <Alert severity="warning">User not found</Alert>
          <Button variant="outlined" onClick={() => router.push('/admin/users')} sx={{ mt: 2 }}>
            Back to User List
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">User Profile</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!editMode ? (
              <>
                <Button variant="contained" onClick={handleEdit}>
                  Edit
                </Button>
                <Button variant="outlined" onClick={() => router.push('/admin/users')}>
                  Back to User List
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? <CircularProgress size={24} /> : 'Save'}
                </Button>
                <Button variant="outlined" onClick={handleCancel} disabled={saveLoading}>
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="ID"
              value={formData.id}
              disabled
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!editMode}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!editMode}
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              disabled={!editMode}
              required
            />
            <TextField
              fullWidth
              label="NID"
              value={formData.nid}
              onChange={(e) => handleChange('nid', e.target.value)}
              disabled={!editMode}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                disabled={!editMode}
                label="Role"
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Agent">Agent</MenuItem>
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Merchant">Merchant</MenuItem>
              </Select>
            </FormControl>
            {formData.balance !== undefined && (
              <TextField
                fullWidth
                label="Balance"
                value={formData.balance}
                disabled
                InputProps={{ readOnly: true }}
              />
            )}
          </Stack>
        </Paper>

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
      </Box>
    </DashboardLayout>
  );
}
