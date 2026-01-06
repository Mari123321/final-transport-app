import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  ButtonGroup,
  FormControl,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  PieChart as PieChartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import AppDatePicker from '../components/common/AppDatePicker';
import dayjs from 'dayjs';

const DashboardAnalytics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [timeMode, setTimeMode] = useState('monthly');
  const [customDates, setCustomDates] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [topContributors, setTopContributors] = useState({ topClients: [], topDrivers: [] });
  const [insights, setInsights] = useState([]);

  // Colors for charts
  const COLORS = {
    primary: '#667eea',
    secondary: '#f093fb',
    tertiary: '#4facfe',
    quaternary: '#fa709a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  const PIE_COLORS = ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#fee140', '#30cfd0'];

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({ mode: timeMode });
      if (timeMode === 'custom') {
        params.append('startDate', customDates.startDate);
        params.append('endDate', customDates.endDate);
      }

      const [
        dashboardRes,
        trendRes,
        breakdownRes,
        cashFlowRes,
        contributorsRes,
        insightsRes,
      ] = await Promise.all([
        api.get(`/api/analytics/dashboard?${params}`),
        api.get(`/api/analytics/revenue-trend?${params}`),
        api.get(`/api/analytics/expense-breakdown?${params}`),
        api.get(`/api/analytics/cash-flow?${params}`),
        api.get(`/api/analytics/top-contributors?${params}`),
        api.get(`/api/analytics/insights?${params}`),
      ]);

      setDashboardData(dashboardRes.data);
      setRevenueTrend(trendRes.data.data || []);
      setExpenseBreakdown(breakdownRes.data.data || []);
      setCashFlow(cashFlowRes.data.data || []);
      setTopContributors(contributorsRes.data);
      setInsights(insightsRes.data.insights || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeMode, customDates]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchDashboardData]);

  // Format currency
  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Format percentage
  const formatPercent = (value) => {
    const val = parseFloat(value || 0);
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  // Summary Card Component
  const SummaryCard = ({ title, value, change, trend, icon: Icon, gradient, subtitle }) => (
    <Card
      sx={{
        background: gradient,
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontSize: '0.875rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: isMobile ? '1.5rem' : '2rem' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                {subtitle}
              </Typography>
            )}
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trend === 'up' ? (
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16 }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatPercent(change)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  vs prev period
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 48, opacity: 0.3 }} />
        </Box>
      </CardContent>
    </Card>
  );

  // Insight Card Component
  const InsightCard = ({ insight }) => {
    const getIcon = () => {
      switch (insight.type) {
        case 'success':
          return <CheckCircleIcon sx={{ color: COLORS.success }} />;
        case 'warning':
          return <WarningIcon sx={{ color: COLORS.warning }} />;
        case 'alert':
          return <WarningIcon sx={{ color: COLORS.error }} />;
        default:
          return <InfoIcon sx={{ color: '#64748b' }} />;
      }
    };

    const getBgColor = () => {
      switch (insight.type) {
        case 'success':
          return '#d1fae5';
        case 'warning':
          return '#fef3c7';
        case 'alert':
          return '#fee2e2';
        default:
          return '#e0e7ff';
      }
    };

    return (
      <Paper
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: getBgColor(),
          borderLeft: `4px solid`,
          borderLeftColor: insight.severity === 'positive' ? COLORS.success : 
                          insight.severity === 'negative' ? COLORS.error : '#64748b',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {getIcon()}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
              {insight.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              {insight.message}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const summary = dashboardData?.summary;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssessmentIcon sx={{ fontSize: 32, color: '#1976d2' }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Real-Time Analytics Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh Dashboard">
              <IconButton
                onClick={fetchDashboardData}
                sx={{
                  backgroundColor: 'white',
                  '&:hover': { backgroundColor: '#f1f5f9' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Chip
              label={autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Time Controls */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: '#64748b' }} />
          <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }}>
            Time Period
          </Typography>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <ButtonGroup fullWidth variant="outlined">
              {['daily', 'weekly', 'monthly'].map((mode) => (
                <Button
                  key={mode}
                  onClick={() => setTimeMode(mode)}
                  variant={timeMode === mode ? 'contained' : 'outlined'}
                  sx={{
                    textTransform: 'capitalize',
                    ...(timeMode === mode && {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }),
                  }}
                >
                  {mode}
                </Button>
              ))}
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              onClick={() => setTimeMode('custom')}
              variant={timeMode === 'custom' ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'capitalize',
                ...(timeMode === 'custom' && {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }),
              }}
            >
              Custom
            </Button>
          </Grid>
          {timeMode === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <AppDatePicker
                  label="Start Date"
                  value={customDates.startDate}
                  onChange={(date) => setCustomDates({ ...customDates, startDate: date })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppDatePicker
                  label="End Date"
                  value={customDates.endDate}
                  onChange={(date) => setCustomDates({ ...customDates, endDate: date })}
                  fullWidth
                  size="small"
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(summary?.revenue?.current)}
            change={summary?.revenue?.change}
            trend={summary?.revenue?.trend}
            icon={AttachMoneyIcon}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            subtitle="Income from invoices"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Total Outgoing"
            value={formatCurrency(summary?.outgoing?.current)}
            change={summary?.outgoing?.change}
            trend={summary?.outgoing?.trend}
            icon={ShowChartIcon}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            subtitle="Diesel + Expenses"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Net Profit"
            value={formatCurrency(summary?.profit?.current)}
            change={summary?.profit?.change}
            trend={summary?.profit?.trend}
            icon={TrendingUpIcon}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            subtitle={`Margin: ${summary?.profit?.margin?.toFixed(1)}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Outstanding"
            value={formatCurrency(summary?.deposits?.outstanding)}
            icon={AccountBalanceIcon}
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            subtitle="Pending payments"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>
              Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Expense Breakdown Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>
              Expense Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => 
                    `${category}: ${percentage?.toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Cash Flow Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>
              Cash Flow Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="inflow" fill={COLORS.success} name="Inflow" radius={[8, 8, 0, 0]} />
                <Bar dataKey="outflow" fill={COLORS.error} name="Outflow" radius={[8, 8, 0, 0]} />
                <Bar dataKey="netFlow" fill={COLORS.tertiary} name="Net Flow" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Contributors & Insights */}
      <Grid container spacing={3}>
        {/* Top Contributors */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>
              Top Earning Clients
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topContributors.topClients.map((client, index) => (
                <Box
                  key={client.clientId}
                  sx={{
                    p: 2,
                    backgroundColor: '#f8fafc',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ backgroundColor: '#667eea', color: 'white', fontWeight: 600 }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                      {client.clientName}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.success }}>
                    {formatCurrency(client.revenue)}
                  </Typography>
                </Box>
              ))}
              {topContributors.topClients.length === 0 && (
                <Alert severity="info">No client data available for this period</Alert>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>
              Highest Cost Drivers
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topContributors.topDrivers.map((driver, index) => (
                <Box
                  key={driver.driverId}
                  sx={{
                    p: 2,
                    backgroundColor: '#fef3c7',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: 600 }}
                    />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {driver.driverName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {driver.litres?.toFixed(1)} litres
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.warning }}>
                    {formatCurrency(driver.cost)}
                  </Typography>
                </Box>
              ))}
              {topContributors.topDrivers.length === 0 && (
                <Alert severity="info">No driver expense data available for this period</Alert>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Auto-Generated Insights */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>
              Business Insights
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
              Auto-generated insights based on your data trends
            </Typography>
            <Box sx={{ maxHeight: '500px', overflowY: 'auto', pr: 1 }}>
              {insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Operational Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 48, color: COLORS.primary, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {summary?.operations?.tripCount || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Total Trips
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <AssessmentIcon sx={{ fontSize: 48, color: COLORS.secondary, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {summary?.operations?.invoiceCount || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Invoices Generated
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <PieChartIcon sx={{ fontSize: 48, color: COLORS.tertiary, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {summary?.operations?.dieselLitres?.toFixed(0) || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Diesel Litres
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardAnalytics;
