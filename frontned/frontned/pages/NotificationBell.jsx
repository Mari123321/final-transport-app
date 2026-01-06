import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CreditCardIcon from "@mui/icons-material/CreditCard";

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications");
      const { pendingInvoices, expiringLicenses } = res.data;

      let alerts = [];

      // pending invoices
      pendingInvoices.forEach((inv) => {
        alerts.push({
          type: "invoice",
          message: `Invoice #${inv.invoice_id} pending - $${inv.amount}`,
        });
      });

      // expiring licenses
      expiringLicenses.forEach((driver) => {
        const date = new Date(driver.license_expiry_date).toLocaleDateString();
        alerts.push({
          type: "license",
          message: `Driver ${driver.name}'s license expires on ${date}`,
        });
      });

      setNotifications(alerts);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {notifications.length > 0 ? (
          notifications.map((note, i) => (
            <MenuItem key={i} onClick={handleClose}>
              <ListItemIcon>
                {note.type === "invoice" ? (
                  <ReceiptIcon color="primary" fontSize="small" />
                ) : (
                  <CreditCardIcon color="secondary" fontSize="small" />
                )}
              </ListItemIcon>
              <Typography variant="body2">{note.message}</Typography>
            </MenuItem>
          ))
        ) : (
          <MenuItem>
            <Typography variant="body2">No new notifications</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
