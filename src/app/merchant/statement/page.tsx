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

export default function MerchantStatement() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [phoneNumber, setPhoneNumber] = useState('');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const calculateRunningBalance = () => {
    let balance = 0;
    return transactions.map(transaction => {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          Transaction History {!loading && `(Total: ${totalTransactions})`}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} elevation={3}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>From Account</strong></TableCell>
                    <TableCell><strong>To Account</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Transaction ID</strong></TableCell>
                    <TableCell><strong>Debit</strong></TableCell>
                    <TableCell><strong>Credit</strong></TableCell>
                    <TableCell><strong>Balance</strong></TableCell>
                    <TableCell><strong>Transaction Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionsWithBalance.length > 0 ? (
                    transactionsWithBalance.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.from_account}</TableCell>
                        <TableCell>{transaction.to_account}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.trnxId}</TableCell>
                        <TableCell>
                          {transaction.debit ? transaction.debit.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          {transaction.credit ? transaction.credit.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          <strong>
                            {transaction.runningBalance?.toFixed(2) || '0.00'}
                          </strong>
                        </TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
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
