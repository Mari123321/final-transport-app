import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { motion } from "framer-motion";

const Topbar = ({ children }) => {
  const navigate = useNavigate();

  // Profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  // Notifications menu
  const [anchorNotif, setAnchorNotif] = useState(null);
  const handleOpenNotif = (event) => setAnchorNotif(event.currentTarget);
  const handleCloseNotif = () => setAnchorNotif(null);

  // Notifications state
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState(null);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const res = await fetch("http://localhost:5000/api/notifications");
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  const pendingCount = notifications?.pendingInvoices?.length || 0;
  const expiringCount = notifications?.expiringLicenses?.length || 0;
  const totalCount = pendingCount + expiringCount;

  return (
    <>
      {/* Animated Topbar */}
      <motion.div
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: "linear-gradient(90deg, #0d47a1, #1976d2)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {/* Logo / Title */}
            <Typography
              variant="h5"
              component={Link}
              to="/dashboard"
              sx={{
                textDecoration: "none",
                color: "#fff",
                fontWeight: "bold",
                letterSpacing: 1,
                userSelect: "none",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                cursor: "pointer",
                "&:hover": {
                  color: "#ffd700",
                  transition: "color 0.3s ease",
                },
              }}
            >
              Transport Management System
            </Typography>

            {/* Right-side icons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* Notifications */}
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileFocus={{ scale: 1.15 }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                }}
              >
                <Tooltip title="Notifications" arrow>
                  <IconButton
                    aria-label="View notifications"
                    color="inherit"
                    size="large"
                    onClick={handleOpenNotif}
                  >
                    <Badge
                      badgeContent={totalCount}
                      color="error"
                      overlap="circular"
                      anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </motion.div>

              {/* Notifications Dropdown */}
              <Menu
                id="notifications-menu"
                anchorEl={anchorNotif}
                open={Boolean(anchorNotif)}
                onClose={handleCloseNotif}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  elevation: 5,
                  sx: { mt: 1.5, minWidth: 320, borderRadius: 2 },
                }}
                disableScrollLock
              >
                <MenuItem disabled sx={{ fontWeight: 600, fontSize: 14 }}>
                  Notifications
                </MenuItem>
                <Divider />

                {/* Loading State */}
                {notifications === null && !error && (
                  <MenuItem>
                    <CircularProgress size={20} sx={{ mr: 2 }} />
                    Loading...
                  </MenuItem>
                )}

                {/* Error State */}
                {error && <MenuItem disabled>Error: {error}</MenuItem>}

                {/* Pending Invoices */}
                {pendingCount > 0 ? (
                  notifications.pendingInvoices.map((inv, i) => (
                    <MenuItem
                      key={`inv-${i}`}
                      onClick={() => {
                        handleCloseNotif();
                        navigate(`/invoices/${inv.id}`);
                      }}
                    >
                      🧾 Invoice #{inv.invoice_no} – ${inv.amount} is pending
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No pending invoices</MenuItem>
                )}

                <Divider />

                {/* Expiring Licenses */}
                {expiringCount > 0 ? (
                  notifications.expiringLicenses.map((lic, i) => (
                    <MenuItem
                      key={`lic-${i}`}
                      onClick={() => {
                        handleCloseNotif();
                        navigate(`/drivers/${lic.driver_id}`);
                      }}
                    >
                      🚦 Driver {lic.driver_name}'s license expires on{" "}
                      {new Date(lic.expiry_date).toLocaleDateString()}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No expiring licenses</MenuItem>
                )}
              </Menu>

              {/* Profile Menu */}
              <Tooltip title="Account settings" arrow>
                <motion.div
                  whileHover={{ scale: 1.3 }}
                  whileFocus={{ scale: 1.3 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <IconButton
                    onClick={handleOpenMenu}
                    color="inherit"
                    aria-controls={anchorEl ? "account-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={anchorEl ? "true" : undefined}
                    aria-label="Open account menu"
                    size="large"
                    sx={{
                      border: "2px solid transparent",
                      transition: "border-color 0.3s ease",
                      "&:focus-visible": {
                        borderColor: "#ffd700",
                        outline: "none",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "#1565c0",
                        fontWeight: "bold",
                        fontSize: 20,
                        userSelect: "none",
                      }}
                    >
                      <AccountCircleIcon fontSize="large" />
                    </Avatar>
                  </IconButton>
                </motion.div>
              </Tooltip>

              {/* Account Menu */}
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  elevation: 5,
                  sx: {
                    mt: 1.5,
                    minWidth: 160,
                    borderRadius: 2,
                  },
                }}
                disableScrollLock
              >
                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    navigate("/profile");
                  }}
                  sx={{ fontWeight: 600, fontSize: 14 }}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    navigate("/logout");
                  }}
                  sx={{ fontWeight: 600, fontSize: 14 }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      </motion.div>

      {/* Push page content below Topbar */}
      <Box component="main" sx={{ pt: 10, px: 3 }}>
        {children}
      </Box>
    </>
  );
};

export default Topbar;
