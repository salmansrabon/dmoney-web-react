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
  const [allSearchResults, setAllSearchResults] = useState<User[]>([]); // Store all search results for pagination
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
  }, [currentPage, searchTerm, roleFilter, rowsPerPage, router]);

  const sortUsersById = (usersList: User[]) => {
    return usersList.sort((a, b) => b.id - a.id); // Descending order (highest ID first)
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
          order: 'desc',
        }
      });
      const usersList = response.data.users || [];
      setUsers(usersList);
      setTotalUsers(response.data.total || response.data.count || 0);
      setAllSearchResults([]); // Clear search results if not searching
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalUsers(0);
      setAllSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const term = searchTerm.trim();
      let response;
      let usersList: User[] = [];
      // Simulate a search by fetching all users and filtering client-side
      const allUsersResp = await API.get('/user/list', { params: { count: 1000, page: 1, order: 'desc' } });
      const allUsers: User[] = allUsersResp.data.users || [];
      if (/^\d+$/.test(term)) {
        // If it's all digits, search by ID or phone number
        usersList = allUsers.filter(u => u.id.toString() === term || u.phone_number === term);
      } else if (term.includes('@')) {
        usersList = allUsers.filter(u => u.email.toLowerCase() === term.toLowerCase());
      } else {
        usersList = allUsers.filter(u => u.phone_number === term);
      }
      usersList = sortUsersById(usersList);
      setAllSearchResults(usersList);
      setTotalUsers(usersList.length);
      // Slice for current page
      const startIdx = (currentPage - 1) * rowsPerPage;
      setUsers(usersList.slice(startIdx, startIdx + rowsPerPage));
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      setTotalUsers(0);
      setAllSearchResults([]);
    }
  };

  const searchByRole = async () => {
    try {
      // Simulate a role search by fetching all users and filtering client-side
      const allUsersResp = await API.get('/user/list', { params: { count: 1000, page: 1, order: 'desc' } });
      const allUsers: User[] = allUsersResp.data.users || [];
      const usersList = sortUsersById(allUsers.filter(u => u.role.toLowerCase() === roleFilter.toLowerCase()));
      setAllSearchResults(usersList);
      setTotalUsers(usersList.length);
      // Slice for current page
      const startIdx = (currentPage - 1) * rowsPerPage;
      setUsers(usersList.slice(startIdx, startIdx + rowsPerPage));
    } catch (error) {
      console.error('Error searching by role:', error);
      setUsers([]);
      setTotalUsers(0);
      setAllSearchResults([]);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // fetchUsers will be triggered by useEffect
  };

  const handleViewProfile = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // If searching, slice the search results for the new page
    if (searchTerm.trim() && allSearchResults.length > 0) {
      const startIdx = (page - 1) * rowsPerPage;
      setUsers(allSearchResults.slice(startIdx, startIdx + rowsPerPage));
    }
    // If filtering by role
    if (roleFilter && allSearchResults.length > 0) {
      const startIdx = (page - 1) * rowsPerPage;
      setUsers(allSearchResults.slice(startIdx, startIdx + rowsPerPage));
    }
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
    // If searching, slice the search results for the new rowsPerPage
    if ((searchTerm.trim() || roleFilter) && allSearchResults.length > 0) {
      setUsers(allSearchResults.slice(0, rows));
    }
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
