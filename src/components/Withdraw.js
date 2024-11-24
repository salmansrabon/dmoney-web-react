import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const Withdraw = () => {
  const [formData, setFormData] = useState({
    from_account: "",
    to_account: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    // Retrieve the logged-in user's phone number from localStorage
    const phoneNumber = localStorage.getItem("phoneNumber");

    // Set the from_account field in formData
    if (phoneNumber) {
      setFormData((prevData) => ({
        ...prevData,
        from_account: phoneNumber, // Set from_account from localStorage
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Confirmation Alert
    const isConfirmed = window.confirm(
      "Are you sure you want to proceed with the withdrawal?"
    );
    if (!isConfirmed) {
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/transaction/withdraw`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-AUTH-SECRET-KEY": process.env.REACT_APP_SECRET_KEY,
          },
        }
      );
      setResponse(res.data);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f7f7f7",
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3 }}>
          Withdraw Money
        </Typography>
        <form onSubmit={handleSubmit}>
          {/* To Account */}
          <TextField
            label="To Account"
            fullWidth
            required
            value={formData.to_account}
            onChange={(e) =>
              setFormData({ ...formData, to_account: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            fullWidth
            required
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseInt(e.target.value) })
            }
            sx={{ mb: 2 }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ height: 50, fontSize: 16 }}
          >
            {loading ? (
                <><CircularProgress size={24} sx={{ color: "#fff" }} />
              Transacction is processing...</>
            ) : (
              "Withdraw"
            )}
          </Button>
        </form>

        {/* Response Section */}
        {response && (
          <Box sx={{ mt: 3, textAlign: "left" }}>
            <Typography variant="h6" color="success.main">
              {response.message}
            </Typography>
            <Typography>Transaction ID: {response.trnxId || "-"}</Typography>
            <Typography>
              Fee:{" "}
              {response.fee !== undefined ? response.fee.toFixed(2) : "-"}
            </Typography>
            <Typography>
              Current Balance:{" "}
              {response.currentBalance !== undefined
                ? response.currentBalance.toFixed(2)
                : "N/A"}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Withdraw;
