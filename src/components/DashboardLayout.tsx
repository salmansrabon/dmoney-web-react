'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CssBaseline, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LeftMenu from './LeftMenu';

interface DashboardLayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const [role, setRole] = React.useState<string>('User');
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role');
      
      // Check if localStorage has authentication data
      if (!token || !userRole) {
        // Clear any remaining data and redirect to login
        localStorage.clear();
        document.cookie = 'token=; path=/; max-age=0';
        router.push('/login');
        return;
      }
      
      setRole(userRole);
      setIsAuthenticated(true);
    }
  }, [router]);

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
      // Clear the token cookie
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      {/* AppBar for the Header */}
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {role} Dashboard
          </Typography>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar alt="User Profile" src="/static/images/avatar/1.jpg" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Menu */}
      <LeftMenu mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      
      {/* Main Content Section */}
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
