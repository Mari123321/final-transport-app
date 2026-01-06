import React from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Topbar />
        {/* Ensure content is pushed below Topbar */}
        <Toolbar />
        <Box sx={{ padding: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
