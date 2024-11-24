import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import axios from "axios";

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // Page number (zero-based)
  const [rowsPerPage, setRowsPerPage] = useState(50); // Default limit per page
  const [totalCount, setTotalCount] = useState(0); // Total number of transactions

  useEffect(() => {
    // Fetch transactions when page or rowsPerPage changes
    const fetchTransactions = async () => {
      const token = localStorage.getItem("token");
      setLoading(true);

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/transaction/list`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-AUTH-SECRET-KEY": process.env.REACT_APP_SECRET_KEY,
            },
            params: {
              limit: rowsPerPage,
              offset: page * rowsPerPage, // Calculate the offset for the current page
            },
          }
        );

        setTransactions(response.data.transactions); // Update transaction list
        setTotalCount(response.data.count); // Update the total count of transactions
      } catch (error) {
        console.error("Error fetching transaction list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, rowsPerPage]);

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage); // Update the page number
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10)); // Update the rows per page
    setPage(0); // Reset to the first page
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
          Please wait... fetching transactions
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: 4,
        maxWidth: "1200px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <Typography variant="h4" sx={{ mb: 4 }}>
        Transaction List
      </Typography>

      <Table
        sx={{
          border: "1px solid #ddd",
          borderRadius: "5px",
          overflow: "hidden",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell><strong>Account</strong></TableCell>
            <TableCell><strong>From Account</strong></TableCell>
            <TableCell><strong>To Account</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell><strong>Transaction ID</strong></TableCell>
            <TableCell><strong>Debit</strong></TableCell>
            <TableCell><strong>Credit</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.id}</TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell>{transaction.from_account}</TableCell>
              <TableCell>{transaction.to_account}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{transaction.trnxId}</TableCell>
              <TableCell>{transaction.debit}</TableCell>
              <TableCell>{transaction.credit}</TableCell>
              <TableCell>
                {new Date(transaction.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount} // Total number of transactions
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
};

export default TransactionList;
