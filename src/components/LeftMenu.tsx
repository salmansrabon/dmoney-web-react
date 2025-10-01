'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Drawer, List, ListItem, ListItemText, Toolbar, Box, Typography } from '@mui/material';

interface MenuItem {
  name: string;
  path: string;
}

interface LeftMenuProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const drawerWidth = 240;

const LeftMenu = ({ mobileOpen, onDrawerToggle }: LeftMenuProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');

      // Define role-based menus
      const roleBasedMenu: { [key: string]: MenuItem[] } = {
        Admin: [
          { name: 'User List', path: '/admin/users' },
          { name: 'Create User', path: '/admin/users/create' },
          { name: 'Transaction List', path: '/admin/transactions' },
        ],
        Agent: [
          { name: 'Cash In', path: '/agent/cash-in' },
          { name: 'Payment', path: '/agent/payment' },
          { name: 'Self Statement', path: '/agent/self-statement' },
        ],
        Customer: [
          { name: 'Send Money', path: '/customer/send-money' },
          { name: 'Cash Out', path: '/customer/cash-out' },
          { name: 'Payment', path: '/customer/payment' },
          { name: 'Self Statement', path: '/customer/self-statement' },
        ],
        Merchant: [
          { name: 'Cash Out', path: '/merchant/cash-out' },
          { name: 'Self Statement', path: '/merchant/self-statement' },
        ],
      };

      // Set menu items based on role
      setMenuItems(roleBasedMenu[role || ''] || []);
    }
  }, []);

  const drawer = (
    <>
      <Box sx={{ 
        height: '64px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Typography variant="h6" fontWeight="bold">
          DMoney
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={Link} 
            href={item.path}
            onClick={onDrawerToggle}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default LeftMenu;
