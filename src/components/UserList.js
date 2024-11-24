import React, { useEffect, useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pagination from './Pagination'; // Reuse the existing Pagination component

const UserList = () => {
  const [originalUsers, setOriginalUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regFrom, setRegFrom] = useState('');
  const [regTo, setRegTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Sort the users in descending order by registration date
        const sortedUsers = response.data.users.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOriginalUsers(sortedUsers); // Store sorted data in the original list
        setFilteredUsers(sortedUsers); // Also update the filtered list
      } catch (error) {
        console.error('Error fetching user list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = () => {
    if (!searchQuery && !regFrom && !regTo) {
      setFilteredUsers(originalUsers);
      return;
    }

    const filtered = originalUsers.filter((user) => {
      const matchesQuery =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone_number.includes(searchQuery);

      const userDate = new Date(user.createdAt).setHours(0, 0, 0, 0);
      const fromDate = regFrom ? new Date(regFrom).setHours(0, 0, 0, 0) : null;
      const toDate = regTo ? new Date(regTo).setHours(0, 0, 0, 0) : null;

      const matchesDate =
        (!fromDate || userDate >= fromDate) &&
        (!toDate || userDate <= toDate);

      return matchesQuery && matchesDate;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to the first page
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

  const handleViewProfile = (id) => {
    navigate(`/admin/user-profile/${id}`);
  };

  if (loading) {
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
        <CircularProgress size={80} sx={{ mb: 2, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Please wait... fetching data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4, maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        User List ({filteredUsers.length})
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          fullWidth
          sx={{ flex: 2 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <TextField
          label="Registration From"
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
          value={regFrom}
          onChange={(e) => setRegFrom(e.target.value)}
        />
        <TextField
          label="Registration To"
          type="date"
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
          value={regTo}
          onChange={(e) => setRegTo(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>
      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Id</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Phone Number</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Registration Date</strong></TableCell>
              <TableCell><strong>View</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone_number}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => handleViewProfile(user.id)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Pagination
        total={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setCurrentPage(1);
        }}
      />
    </Box>
  );
};

export default UserList;
