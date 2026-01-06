import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import GroupIcon from "@mui/icons-material/Group";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import NotificationBell from "./NotificationBell";
import { generateDemoData, clearDemoData } from "../api/demo";
import { toast } from "react-toastify";

const iconStyle = (color) => ({
  backgroundColor: color,
  color: "white",
  width: 48,
  height: 48,
});

const getActivityIcon = (type) => {
  switch (type) {
    case "trip":
      return <MonetizationOnIcon />;
    case "client":
      return <GroupIcon />;
    case "vehicle":
      return <DirectionsCarIcon />;
    default:
      return <ReceiptIcon />;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case "trip":
      return "#43a047";
    case "client":
      return "#1976d2";
    case "vehicle":
      return "#ffb300";
    default:
      return "#e53935";
  }
};

const Dashboard = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [amounts, setAmounts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'generate' or 'clear'
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();

      setDrivers(data.drivers || []);
      setVehicles(data.vehicles || []);
      setClients(data.clients || []);
      setTrips(data.trips || []);
      setAmounts(data.invoices || []);
      setActivities(data.activities || []);
      setRevenueData(data.revenueByMonth || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateDemoData = async () => {
    setDemoLoading(true);
    try {
      const response = await generateDemoData();
      if (response.success) {
        toast.success(`Demo data generated! ${response.data.clients} clients, ${response.data.drivers} drivers, ${response.data.vehicles} vehicles, ${response.data.trips} trips created.`);
        setOpenDialog(false);
        fetchData(); // Refresh dashboard
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate demo data');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleClearDemoData = async () => {
    setDemoLoading(true);
    try {
      const response = await clearDemoData();
      if (response.success) {
        toast.success('All demo data cleared successfully!');
        setOpenDialog(false);
        fetchData(); // Refresh dashboard
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear demo data');
    } finally {
      setDemoLoading(false);
    }
  };

  const openGenerateDialog = () => {
    setDialogType('generate');
    setOpenDialog(true);
  };

  const openClearDialog = () => {
    setDialogType('clear');
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDialogConfirm = () => {
    if (dialogType === 'generate') {
      handleGenerateDemoData();
    } else {
      handleClearDemoData();
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const totalPendingAmounts = amounts.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  );

  const currencyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const summaryStats = [
    {
      title: "Total Drivers",
      value: drivers.length,
      extra: "+0 this month",
      icon: <AccountBoxIcon />,
      color: "#1976d2",
    },
    {
      title: "Total Clients",
      value: clients.length,
      extra: "+0 this month",
      icon: <GroupIcon />,
      color: "#2e7d32",
    },
    {
      title: "Total Vehicles",
      value: vehicles.length,
      icon: <DirectionsCarIcon />,
      color: "#ff9800",
    },
    {
      title: "Total Trips",
      value: trips.length,
      extra: "+0 this week",
      icon: <TripOriginIcon />,
      color: "#ab47bc",
    },
    {
      title: "Pending Amounts",
      value: currencyFormat.format(totalPendingAmounts),
      extra: `${amounts.length} invoices`,
      icon: <ReceiptIcon />,
      color: "#e53935",
    },
  ];

  return (
    <Box
      sx={{
        background: "#f4f6fa",
        minHeight: "100vh",
        pb: 3,
        overflow: "hidden",
      }}
    >
      {/* Notification bell header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px" }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<DataUsageIcon />}
            onClick={openGenerateDialog}
            disabled={demoLoading}
          >
            Generate Demo Data (10 records)
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={openClearDialog}
            disabled={demoLoading}
          >
            Clear All Data
          </Button>
        </Box>
        <NotificationBell />
      </header>

      {/* Demo Data Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogType === 'generate' ? 'Generate Demo Data?' : 'Clear All Data?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogType === 'generate' 
              ? 'This will create 10 sample clients, drivers, vehicles, and trips for testing purposes.'
              : 'This will permanently delete ALL data from the database including clients, drivers, vehicles, trips, invoices, and expenses. This action cannot be undone!'}
          </DialogContentText>
          {dialogType === 'clear' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Warning:</strong> All data will be permanently deleted!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={demoLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDialogConfirm} 
            variant="contained"
            color={dialogType === 'generate' ? 'success' : 'error'}
            disabled={demoLoading}
          >
            {demoLoading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mx: "auto", mt: 4, px: 4, width: "95%" }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, letterSpacing: 1, mb: 3 }}
        >
          Dashboard
        </Typography>

        {/* Summary Stats */}
        <Grid container spacing={2}>
          {summaryStats.map(({ title, value, extra, icon, color }, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card
                sx={{
                  p: 2,
                  bgcolor: "#fff",
                  boxShadow: 4,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  minHeight: 100,
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 8 },
                }}
              >
                <Avatar sx={iconStyle(color)}>{icon}</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {title}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {value}
                  </Typography>
                  {extra && (
                    <Typography variant="caption" color="text.secondary">
                      {extra}
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Revenue Chart */}
        <Paper
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 3,
            bgcolor: "#fff",
            boxShadow: 3,
            height: 320,
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Revenue by Month
          </Typography>
          {revenueData.length > 0 ? (
            <Box sx={{ height: "85%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography textAlign="center" sx={{ py: 10, color: "gray" }}>
              No revenue data to display
            </Typography>
          )}
        </Paper>

        {/* Recent Activity */}
        <Paper
          sx={{ borderRadius: 3, mt: 4, p: 2, bgcolor: "#fff", boxShadow: 2 }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          {activities.length === 0 ? (
            <Typography align="center" sx={{ color: "gray", py: 5 }}>
              No recent activities
            </Typography>
          ) : (
            <List>
              {activities.map((item, idx) => (
                <React.Fragment key={idx}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: getActivityColor(item.type),
                          width: 32,
                          height: 32,
                        }}
                      >
                        {getActivityIcon(item.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography fontWeight={500}>{item.text}</Typography>
                      }
                      secondary={item.time}
                    />
                  </ListItem>
                  {idx < activities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
