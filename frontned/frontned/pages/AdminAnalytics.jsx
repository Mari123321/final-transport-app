import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const AdminAnalytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalTrips: 0,
    avgProfit: 0,
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/analytics/monthly")
      .then((res) => {
        const formatted = res.data.map((d) => ({
          month: `Month ${d.month}`,
          revenue: parseFloat(d.totalRevenue || 0),
          profit: parseFloat(d.totalProfit || 0),
          trips: parseInt(d.tripCount || 0),
        }));
        setData(formatted);

        // Calculate summary
        const totalRevenue = formatted.reduce((sum, d) => sum + d.revenue, 0);
        const totalProfit = formatted.reduce((sum, d) => sum + d.profit, 0);
        const totalTrips = formatted.reduce((sum, d) => sum + d.trips, 0);
        const avgProfit = formatted.length > 0 ? totalProfit / formatted.length : 0;

        setSummary({ totalRevenue, totalProfit, totalTrips, avgProfit });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Monthly Analytics
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography sx={{ color: "#64748b" }}>Loading analytics...</Typography>
        </Box>
      ) : data.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <AssessmentIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
            No analytics data available
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Analytics will appear here once data is available
          </Typography>
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Total Revenue
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ₹{summary.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                        All months
                      </Typography>
                    </Box>
                    <AttachMoneyIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Total Profit
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ₹{summary.totalProfit.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                        Net earnings
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Total Trips
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {summary.totalTrips}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                        Completed
                      </Typography>
                    </Box>
                    <LocalShippingIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(250, 112, 154, 0.4)",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Avg Monthly Profit
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ₹{summary.avgProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                        Per month
                      </Typography>
                    </Box>
                    <AssessmentIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#334155", fontWeight: 600 }}>
                  Revenue vs Profit
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#667eea" name="Revenue" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="profit" fill="#f093fb" name="Profit" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#334155", fontWeight: 600 }}>
                  Trips Count
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="trips" fill="#4facfe" name="Trips" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AdminAnalytics;
