import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { Link, useLocation } from 'react-router-dom';

const drawerWidthExpanded = 260;
const drawerWidthCollapsed = 60;

// Golden accent color matching your brand/highlight
const accentColor = '#FFD700';

// Optionally: assign different accent color for each section if you want more distinction
const navGroups = [
  {
    heading: 'Main',
    color: accentColor,
    items: [{ text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }],
  },
  {
    heading: 'Management',
    color: accentColor,
    items: [
      { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
      { text: 'Drivers', icon: <PersonIcon />, path: '/drivers' },
      { text: 'Vehicles', icon: <DirectionsCarIcon />, path: '/vehicles' },
      { text: 'Trips', icon: <DirectionsCarIcon />, path: '/trips' },
    ],
  },
  {
    heading: 'Finance',
    color: accentColor,
    items: [
      { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices' },
      { text: 'Smart Payments', icon: <PaymentIcon />, path: '/smart-payments' },
      { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
      { text: 'Bills', icon: <DescriptionIcon />, path: '/bills' },
      { text: 'Generate Invoice', icon: <DescriptionIcon />, path: '/generate-invoice' },
      { text: 'Driver Expenses', icon: <LocalGasStationIcon />, path: '/driver-expenses' },
    ],
  },
  {
    heading: 'Analytics',
    color: accentColor,
    items: [
      { text: 'Dashboard Analytics', icon: <BarChartIcon />, path: '/dashboard-analytics' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: 'width 0.3s ease',
        // Hide scrollbars for all browsers
        overflow: "auto",
        scrollbarWidth: "none", // Firefox
        "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari, Edge
        '& .MuiDrawer-paper': {
          width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
          backgroundColor: '#1E2A38',
          color: '#f5f5f5',
          borderRight: 0,
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          fontFamily: '"Roboto", "Helvetica", sans-serif',
          // Hide scrollbars for all browsers
          overflow: "auto",
          scrollbarWidth: "none", // Firefox
          "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari, Edge
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'space-between',
          alignItems: 'center',
          px: 2,
          minHeight: 64,
          userSelect: 'none',
        }}
      >
        {!collapsed && (
          <Box
            sx={{
              fontWeight: 'bold',
              fontSize: '1.6rem',
              letterSpacing: 1,
              color: accentColor,
            }}
          >
            TransportPro
          </Box>
        )}
        <IconButton
          onClick={toggleCollapse}
          size="small"
          sx={{ color: accentColor }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <List sx={{ pt: 0 }}>
        {navGroups.map(({ heading, color, items }) => (
          <Box key={heading} sx={{ mb: collapsed ? 1 : 3 }}>
            {!collapsed && (
              <ListSubheader
                component="div"
                sx={{
                  color:'skyblue',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  pl: 3,
                  pb: 0.5,
                  userSelect: 'none',
                  background: 'transparent',
                  borderLeft: `4px solid ${color}`,
                  borderRadius: '0 6px 6px 0',
                  mb: 1,
                }}
              >
                {heading}
              </ListSubheader>
            )}
            {items.map(({ text, icon, path }) => {
              const isActive = location.pathname === path;
              const listItem = (
                <ListItemButton
                  component={Link}
                  to={path}
                  selected={isActive}
                  sx={{
                    mb: 1,
                    borderRadius: 1.5,
                    px: collapsed ? 1 : 2,
                    py: 1.5,
                    backgroundColor: isActive ? '#2C3E50' : 'transparent',
                    color: isActive ? accentColor : '#F5F5F5',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      backgroundColor: '#34495E',
                      transform: 'scale(1.03)',
                      transition: 'all 0.3s ease',
                    },
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  tabIndex={0}
                >
                  {isActive && !collapsed && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        width: 5,
                        height: '100%',
                        backgroundColor: accentColor,
                        borderRadius: '0 4px 4px 0',
                        zIndex: 1,
                      }}
                    />
                  )}
                  <ListItemIcon
                    sx={{
                      color: isActive ? accentColor : color,
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      zIndex: 2,
                      transition: 'all 0.3s',
                      fontSize: '1.5rem',
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={text}
                      primaryTypographyProps={{
                        fontWeight: 500,
                        letterSpacing: 0.5,
                        fontSize: '0.95rem',
                        zIndex: 2,
                      }}
                    />
                  )}
                </ListItemButton>
              );
              return collapsed ? (
                <Tooltip title={text} key={text} arrow placement="right">
                  {listItem}
                </Tooltip>
              ) : (
                <React.Fragment key={text}>{listItem}</React.Fragment>
              );
            })}
          </Box>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
