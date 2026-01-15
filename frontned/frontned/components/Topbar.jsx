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

  const criticalCount = notifications?.criticalPayments?.length || 0;
  const licenseCount = notifications?.expiringLicenses?.length || 0;
  const rcCount = notifications?.expiringRC?.length || 0;
  const totalCount = criticalCount + licenseCount + rcCount;

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
                  🔔 Important Notifications
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

                {/* Empty State */}
                {notifications && totalCount === 0 && (
                  <MenuItem disabled sx={{ color: "green" }}>
                    ✅ All clear! No urgent notifications
                  </MenuItem>
                )}

                {/* Critical Payments > 200,000 */}
                {criticalCount > 0 && (
                  <>
                    <MenuItem disabled sx={{ fontWeight: 600, fontSize: 12, color: "#d32f2f" }}>
                      🚨 CRITICAL PAYMENTS (&gt; ₹2L)
                    </MenuItem>
                    {notifications.criticalPayments.map((inv, i) => (
                      <MenuItem
                        key={`critical-${i}`}
                        onClick={() => {
                          handleCloseNotif();
                          navigate(`/invoices`);
                        }}
                        sx={{ bgcolor: "#ffebee", "&:hover": { bgcolor: "#ffcdd2" } }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            🧾 Invoice #{inv.invoice_no}
                          </Typography>
                          <Typography variant="caption" color="error">
                            Pending: ₹{parseFloat(inv.pending_amount).toLocaleString("en-IN")}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <Divider />
                  </>
                )}

                {/* Expiring Licenses */}
                {licenseCount > 0 && (
                  <>
                    <MenuItem disabled sx={{ fontWeight: 600, fontSize: 12, color: "#f57c00" }}>
                      🚦 LICENSE EXPIRING SOON
                    </MenuItem>
                    {notifications.expiringLicenses.map((lic, i) => (
                      <MenuItem
                        key={`lic-${i}`}
                        onClick={() => {
                          handleCloseNotif();
                          navigate(`/drivers`);
                        }}
                        sx={{ bgcolor: "#fff3e0", "&:hover": { bgcolor: "#ffe0b2" } }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {lic.driver_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Expires: {new Date(lic.expiry_date).toLocaleDateString("en-IN")}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <Divider />
                  </>
                )}

                {/* Expiring RC */}
                {rcCount > 0 && (
                  <>
                    <MenuItem disabled sx={{ fontWeight: 600, fontSize: 12, color: "#f57c00" }}>
                      🚗 RC UPDATE NEEDED
                    </MenuItem>
                    {notifications.expiringRC.map((rc, i) => (
                      <MenuItem
                        key={`rc-${i}`}
                        onClick={() => {
                          handleCloseNotif();
                          navigate(`/vehicles`);
                        }}
                        sx={{ bgcolor: "#fff3e0", "&:hover": { bgcolor: "#ffe0b2" } }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rc.vehicle_number}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            RC Expires: {new Date(rc.expiry_date).toLocaleDateString("en-IN")}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </>
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
