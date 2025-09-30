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
  account: string;
  from_account: string;
  to_account: string;
  description: string;
  trnxId: string;
  debit: number;
  credit: number;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionList() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetchTransactions();
  }, [currentPage, rowsPerPage, router]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await API.get('/transaction/list', {
        params: {
          page: currentPage,
          count: rowsPerPage,
        },
      });

      const transactionsData = response.data.transactions || [];
      setTransactions(transactionsData);
      setTotalTransactions(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Transaction List {!loading && `(Total: ${totalTransactions})`}
        </Typography>

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
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction, index) => (
                      <TableRow key={`${transaction.id}-${index}`}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.from_account}</TableCell>
                        <TableCell>{transaction.to_account}</TableCell>
                        <TableCell>{transaction.credit || transaction.debit}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
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
