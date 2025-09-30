'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Drawer, List, ListItem, ListItemText, Toolbar } from '@mui/material';

interface MenuItem {
  name: string;
  path: string;
}

const LeftMenu = () => {
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
          { name: 'Self Statement', path: '/customer/statement' },
        ],
        Merchant: [
          { name: 'Cash Out', path: '/merchant/cash-out' },
          { name: 'Self Statement', path: '/merchant/statement' },
        ],
      };

      // Set menu items based on role
      setMenuItems(roleBasedMenu[role || ''] || []);
    }
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={Link} 
            href={item.path}
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
    </Drawer>
  );
};

export default LeftMenu;
