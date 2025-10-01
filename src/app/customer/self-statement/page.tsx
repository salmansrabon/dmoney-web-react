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
  CircularProgress,
  TextField,
  Button,
} from '@mui/material';

interface Transaction {
  id: number;
  account: string;
  from_account: string;
  to_account: string;
  description: string;
  trnxId: string;
  debit: number;
  credit: number;
  createdAt: string;
  updatedAt: string;
  runningBalance?: number;
}

export default function Statement() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentBalance, setCurrentBalance] = useState<string>('0');
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [fromDate, setFromDate] = useState<string>(getTodayDate());
  const [toDate, setToDate] = useState<string>(getTodayDate());

  useEffect(() => {
    const fetchUserPhone = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');

      if (!token) {
        router.replace('/login');
        return;
      }

      if (!email) {
        console.error('Email not found in localStorage.');
        setLoading(false);
        return;
      }

      try {
        const encodedEmail = encodeURIComponent(email);
        const res = await API.get(`/user/search/email/${encodedEmail}`);
        setPhoneNumber(res.data.user.phone_number);
        setCurrentBalance(res.data.user.balance || localStorage.getItem('balance') || '0');
      } catch (error) {
        console.error('Error fetching user phone number:', error);
        setLoading(false);
      }
    };

    fetchUserPhone();
  }, [router]);

  useEffect(() => {
    if (!phoneNumber) return;

    const fetchTransactions = async () => {
      setLoading(true);

      try {
        const response = await API.get(`/transaction/statement/${phoneNumber}`, {
          params: {
            page: currentPage,
            count: rowsPerPage,
          },
        });
        setTransactions(response.data.transactions || []);
        setTotalTransactions(response.data.total || 0);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [phoneNumber, currentPage, rowsPerPage]);

  // Filter transactions by date range
  const filterTransactionsByDate = (transactions: Transaction[]) => {
    if (!fromDate || !toDate) return transactions;
    
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= from && transactionDate <= to;
    });
  };

  const filteredTransactions = filterTransactionsByDate(transactions);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate running balance for each transaction in ascending order
  const calculateRunningBalance = () => {
    let balance = 0;
    // Reverse to get oldest first, calculate balance, then keep in ascending order
    const reversedTransactions = [...filteredTransactions].reverse();
    return reversedTransactions.map(transaction => {
      if (transaction.credit) {
        balance += transaction.credit;
      }
      if (transaction.debit) {
        balance -= transaction.debit;
      }
      return { ...transaction, runningBalance: balance };
    });
  };

  const transactionsWithBalance = calculateRunningBalance();

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Transaction History {!loading && `(Total: ${totalTransactions})`}
          </Typography>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Current Balance: BDT {parseFloat(currentBalance).toFixed(2)}
          </Typography>
        </Box>

        {/* Date Filter */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <TextField
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <TextField
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFromDate(getTodayDate());
                  setToDate(getTodayDate());
                }}
                fullWidth
              >
                Reset to Today
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Showing {transactionsWithBalance.length} transaction(s) from {fromDate} to {toDate}
          </Typography>
        </Paper>

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
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Sender Account</TableCell>
                    <TableCell>Receiver Account</TableCell>
                    <TableCell>Debit</TableCell>
                    <TableCell>Credit</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionsWithBalance.length > 0 ? (
                    transactionsWithBalance.map((transaction, index) => (
                      <TableRow key={`${transaction.id}-${index}`}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.from_account}</TableCell>
                        <TableCell>{transaction.to_account}</TableCell>
                        <TableCell>{transaction.debit ? transaction.debit.toFixed(2) : '-'}</TableCell>
                        <TableCell>{transaction.credit ? transaction.credit.toFixed(2) : '-'}</TableCell>
                        <TableCell><strong>{transaction.runningBalance?.toFixed(2) || '0.00'}</strong></TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Pagination
              total={totalTransactions}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
