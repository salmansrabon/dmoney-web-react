'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Pagination from '@/components/Pagination';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
} from '@mui/material';

interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  nid: string;
  role: string;
  createdAt?: string;
}

export default function UserList() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, router]);

  const sortUsersByCreatedAt = (usersList: User[]) => {
    return usersList.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // If there's a search term, use the appropriate search endpoint
      if (searchTerm.trim()) {
        await searchUsers();
        return;
      }
      
      // If there's a role filter, use the role search endpoint
      if (roleFilter) {
        await searchByRole();
        return;
      }
      
      // Otherwise, fetch all users with pagination
      const response = await API.get('/user/list', {
        params: {
          count: rowsPerPage,
          page: currentPage,
        }
      });

      const usersList = response.data.users || [];
      setUsers(sortUsersByCreatedAt(usersList));
      setTotalUsers(response.data.total || response.data.count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const term = searchTerm.trim();
      let response;

      // Determine what type of search based on the input
      if (/^\d+$/.test(term)) {
        // If it's all digits, search by ID first, then try phone number
        try {
          response = await API.get(`/user/search/id/${term}`);
        } catch (err) {
          // If ID search fails, try phone number
          response = await API.get(`/user/search/phonenumber/${term}`);
        }
        // API returns a single user object, so wrap it in an array
        const usersList = response.data.user ? [response.data.user] : [];
        setUsers(sortUsersByCreatedAt(usersList));
        setTotalUsers(response.data.user ? 1 : 0);
      } else if (term.includes('@')) {
        // If it contains @, search by email
        const encodedEmail = encodeURIComponent(term);
        response = await API.get(`/user/search/email/${encodedEmail}`);
        // API returns a single user object, so wrap it in an array
        const usersList = response.data.user ? [response.data.user] : [];
        setUsers(sortUsersByCreatedAt(usersList));
        setTotalUsers(response.data.user ? 1 : 0);
      } else {
        // Otherwise, try to search by phone number or show empty
        try {
          response = await API.get(`/user/search/phonenumber/${term}`);
          const usersList = response.data.user ? [response.data.user] : [];
          setUsers(sortUsersByCreatedAt(usersList));
          setTotalUsers(response.data.user ? 1 : 0);
        } catch (err) {
          setUsers([]);
          setTotalUsers(0);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      setTotalUsers(0);
    }
  };

  const searchByRole = async () => {
    try {
      const response = await API.get(`/user/search/${roleFilter.toLowerCase()}`);
      const usersList = response.data.users || [];
      setUsers(sortUsersByCreatedAt(usersList));
      setTotalUsers(response.data.users?.length || 0);
    } catch (error) {
      console.error('Error searching by role:', error);
      setUsers([]);
      setTotalUsers(0);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleViewProfile = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await API.delete(`/user/delete/${userToDelete.id}`);
      setSnackbarMessage(`User ${userToDelete.name} deleted successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // Refresh the user list
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to delete user');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4">
            User List
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white',
              bgcolor: 'primary.main',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 'bold'
            }}
          >
            Total: {totalUsers}
          </Typography>
        </Box>

        {/* Search and Filter Section */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Agent">Agent</MenuItem>
              <MenuItem value="Customer">Customer</MenuItem>
              <MenuItem value="Merchant">Merchant</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>

        {/* User Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>NID</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Registered Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <TableRow key={`${user.id}-${index}`}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>{user.nid}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewProfile(user.id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Pagination
              total={totalUsers}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
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
