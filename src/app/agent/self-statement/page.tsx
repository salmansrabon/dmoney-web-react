'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
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
  Chip,
} from '@mui/material';

interface Transaction {
  id: number;
  from_account: string;
  to_account: string;
  description: string;
  trnxId: string;
  debit: number;
  credit: number;
  createdAt: string;
  runningBalance?: number;
}

export default function SelfStatement() {
  const router = useRouter();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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

    const fetchAllTransactions = async () => {
      setLoading(true);

      try {
        const response = await API.get(`/transaction/statement/${phoneNumber}`, {
          params: {
            page: 1,
            count: 10000,
          },
        });
        setAllTransactions(response.data.transactions || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [phoneNumber]);

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

  const filteredTransactions = filterTransactionsByDate(allTransactions);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Calculate running balance for each transaction in ascending order
  const calculateRunningBalance = () => {
    let prevBalance = 0;
    if (fromDate) {
      const filterStart = new Date(fromDate);
      filterStart.setHours(0, 0, 0, 0);

      const previousTransactions = [...allTransactions]
        .reverse()
        .filter(t => new Date(t.createdAt) < filterStart);

      previousTransactions.forEach(transaction => {
        if (transaction.credit) prevBalance += transaction.credit;
        if (transaction.debit) prevBalance -= transaction.debit;
      });
    }

    let balance = prevBalance;
    const reversedTransactions = [...filteredTransactions].reverse();
    return reversedTransactions.map(transaction => {
      if (transaction.credit) balance += transaction.credit;
      if (transaction.debit) balance -= transaction.debit;
      return { ...transaction, runningBalance: balance };
    });
  };

  const transactionsWithBalance = calculateRunningBalance();

  const headerCellSx = {
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#1a237e',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap' as const,
    borderRight: '1px solid rgba(255,255,255,0.12)',
    '&:last-child': { borderRight: 'none' },
  };

  return (
    <DashboardLayout>
      <Box>
        {/* Page Title & Balance */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Transaction History{!loading && ` (Total: ${allTransactions.length})`}
          </Typography>
          <Box
            sx={{
              backgroundColor: 'primary.main',
              color: '#fff',
              borderRadius: 2,
              px: 2.5,
              py: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Current Balance: BDT {parseFloat(currentBalance).toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Date Filter Card */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 220px', minWidth: '180px' }}>
              <TextField
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 220px', minWidth: '180px' }}>
              <TextField
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFromDate(getTodayDate());
                  setToDate(getTodayDate());
                }}
                sx={{ height: '40px', minWidth: '140px', textTransform: 'uppercase', fontWeight: 600 }}
              >
                Reset to Today
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Showing <strong>{transactionsWithBalance.length}</strong> transaction(s) from{' '}
            <strong>{fromDate}</strong> to <strong>{toDate}</strong>
          </Typography>
        </Paper>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{ borderRadius: 2, overflow: 'hidden' }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>Transaction ID</TableCell>
                  <TableCell sx={headerCellSx}>Sender Account</TableCell>
                  <TableCell sx={headerCellSx}>Receiver Account</TableCell>
                  <TableCell sx={headerCellSx}>Type</TableCell>
                  <TableCell sx={{ ...headerCellSx, color: '#ffb74d' }}>Debit</TableCell>
                  <TableCell sx={{ ...headerCellSx, color: '#81c784' }}>Credit</TableCell>
                  <TableCell sx={headerCellSx}>Balance</TableCell>
                  <TableCell sx={headerCellSx}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionsWithBalance.length > 0 ? (
                  transactionsWithBalance.map((transaction, index) => (
                    <TableRow
                      key={transaction.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#f9faff' : '#ffffff',
                        '&:hover': { backgroundColor: '#e8eaf6' },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{transaction.id}</TableCell>
                      <TableCell>{transaction.from_account}</TableCell>
                      <TableCell>{transaction.to_account}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.description || 'N/A'}
                          size="small"
                          sx={{
                            backgroundColor: '#e8eaf6',
                            color: '#1a237e',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: transaction.debit ? '#c62828' : 'text.disabled' }}>
                        {transaction.debit ? transaction.debit.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell sx={{ color: transaction.credit ? '#2e7d32' : 'text.disabled' }}>
                        {transaction.credit ? transaction.credit.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} fontSize="0.875rem">
                          {transaction.runningBalance?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'text.secondary' }}>
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No transactions found for the selected date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </DashboardLayout>
  );
}
