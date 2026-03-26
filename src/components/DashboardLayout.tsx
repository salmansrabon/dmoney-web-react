'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LeftMenu from './LeftMenu';
import API from '@/lib/api';

interface DashboardLayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const [role, setRole] = React.useState<string>('User');
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  // Balance toggle state
  const [showBalance, setShowBalance] = React.useState<boolean>(false);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = React.useState<boolean>(false);

  const router = useRouter();

  // ── Helper: check whether the stored JWT is past its exp claim ─────────────
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // ── Shared logout routine ─────────────────────────────────────────────────
  const forceLogout = React.useCallback(() => {
    localStorage.clear();
    document.cookie = 'token=; path=/; max-age=0';
    router.replace('/login');
  }, [router]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const token    = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // 1. Missing credentials
    if (!token || !userRole) {
      forceLogout();
      return;
    }

    // 2. Token already expired on mount (e.g. browser tab was left open overnight)
    if (isTokenExpired(token)) {
      forceLogout();
      return;
    }

    setRole(userRole);
    setIsAuthenticated(true);

    // 3. Periodic check every 30 seconds — catches idle sessions without any API call
    const interval = setInterval(() => {
      const t = localStorage.getItem('token');
      if (!t || isTokenExpired(t)) {
        forceLogout();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [forceLogout]);

  // Don't render dashboard content until authentication is verified
  if (!isAuthenticated) {
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      document.cookie = 'token=; path=/; max-age=0';
    }
    router.push('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    router.push('/profile');
  };

  const handleChangePassword = () => {
    handleMenuClose();
    router.push('/change-password');
  };

  // Toggle: hide if already shown, fetch + show if hidden
  const handleToggleBalance = async () => {
    if (showBalance) {
      setShowBalance(false);
      return;
    }

    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) return;

    setBalanceLoading(true);
    try {
      const response = await API.get(`/transaction/balance/${phoneNumber}`);
      const fetched =
        typeof response.data.balance === 'number'
          ? response.data.balance
          : typeof response.data.currentBalance === 'number'
          ? response.data.currentBalance
          : 0;
      setBalance(fetched);
      setShowBalance(true);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Dashboard title */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {role} Dashboard
          </Typography>

          {/* Balance toggle button */}
          <Button
            color="inherit"
            size="small"
            onClick={handleToggleBalance}
            disabled={balanceLoading}
            startIcon={
              balanceLoading ? (
                <CircularProgress size={14} color="inherit" />
              ) : showBalance ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <AccountBalanceWalletIcon fontSize="small" />
              )
            }
            sx={{
              mr: 2,
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: 2,
              px: 1.5,
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              textTransform: 'none',
              fontWeight: showBalance ? 'bold' : 'normal',
              bgcolor: showBalance ? 'rgba(255,255,255,0.15)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            {balanceLoading
              ? 'Loading…'
              : showBalance && balance !== null
              ? `৳ ${balance.toFixed(2)}`
              : 'Balance'}
          </Button>

          {/* Avatar / profile menu */}
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar alt="User Profile" src="/static/images/avatar/1.jpg" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Menu */}
      <LeftMenu mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
