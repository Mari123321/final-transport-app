import { 
  Trip, 
  Invoice, 
  Payment, 
  Expense, 
  DriverExpense, 
  Driver, 
  Vehicle, 
  Client 
} from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";
import sequelize from "../config/database.js";

// ==================== HELPER FUNCTIONS ====================

// Get date range based on mode
const getDateRange = (mode, customStart, customEnd) => {
  const now = new Date();
  let startDate, endDate = now;

  switch (mode) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      break;
    
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    
    case 'custom':
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Default to current month if custom dates not provided
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      break;
    
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// Get previous period date range for comparison
const getPreviousPeriodRange = (mode, startDate, customStart, customEnd) => {
  const start = new Date(startDate);
  let prevStart, prevEnd;

  switch (mode) {
    case 'daily':
      prevStart = new Date(start);
      prevStart.setDate(start.getDate() - 1);
      prevEnd = new Date(prevStart);
      prevEnd.setHours(23, 59, 59, 999);
      prevStart.setHours(0, 0, 0, 0);
      break;
    
    case 'weekly':
      prevStart = new Date(start);
      prevStart.setDate(start.getDate() - 7);
      prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;
    
    case 'monthly':
      prevStart = new Date(start);
      prevStart.setMonth(start.getMonth() - 1);
      prevEnd = new Date(start);
      prevEnd.setDate(0); // Last day of previous month
      prevEnd.setHours(23, 59, 59, 999);
      break;
    
    case 'custom':
      if (customStart && customEnd) {
        const diff = new Date(customEnd) - new Date(customStart);
        prevEnd = new Date(customStart);
        prevEnd.setDate(prevEnd.getDate() - 1);
        prevStart = new Date(prevEnd);
        prevStart.setTime(prevStart.getTime() - diff);
      } else {
        prevStart = new Date(start);
        prevStart.setMonth(start.getMonth() - 1);
        prevEnd = new Date(start);
        prevEnd.setDate(0);
      }
      break;
    
    default:
      prevStart = new Date(start);
      prevStart.setMonth(start.getMonth() - 1);
      prevEnd = new Date(start);
      prevEnd.setDate(0);
  }

  return { prevStart, prevEnd };
};

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ==================== MAIN DASHBOARD ANALYTICS ====================

export const getDashboardAnalytics = async (req, res) => {
  try {
    const { mode = 'monthly', startDate: customStart, endDate: customEnd } = req.query;
    
    const { startDate, endDate } = getDateRange(mode, customStart, customEnd);
    const { prevStart, prevEnd } = getPreviousPeriodRange(mode, startDate, customStart, customEnd);

    // ===== CURRENT PERIOD DATA =====
    
    // 1. Revenue from Trips/Invoices
    const revenueData = await Invoice.findOne({
      attributes: [
        [fn('SUM', col('total_amount')), 'totalRevenue'],
        [fn('COUNT', col('invoice_id')), 'invoiceCount']
      ],
      where: {
        invoice_date: { [Op.between]: [startDate, endDate] }
      },
      raw: true
    });

    // 2. Payments Received
    const paymentsData = await Payment.findOne({
      attributes: [
        [fn('SUM', col('paidAmount')), 'totalPaid'],
        [fn('SUM', col('balanceAmount')), 'totalPending']
      ],
      raw: true
    });

    // 3. Diesel Expenses
    const dieselExpenses = await DriverExpense.findOne({
      attributes: [
        [fn('SUM', col('total_amount')), 'totalDiesel'],
        [fn('SUM', col('litres')), 'totalLitres']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      raw: true
    });

    // 4. Other Expenses
    const otherExpenses = await Expense.findOne({
      attributes: [
        [fn('SUM', col('amount')), 'totalExpenses']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      raw: true
    });

    // 5. Trip Statistics
    const tripStats = await Trip.findOne({
      attributes: [
        [fn('COUNT', col('trip_id')), 'tripCount']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      raw: true
    });

    // ===== PREVIOUS PERIOD DATA FOR COMPARISON =====
    
    const prevRevenueData = await Invoice.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'totalRevenue']],
      where: {
        invoice_date: { [Op.between]: [prevStart, prevEnd] }
      },
      raw: true
    });

    const prevDieselExpenses = await DriverExpense.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'totalDiesel']],
      where: {
        date: { [Op.between]: [prevStart, prevEnd] }
      },
      raw: true
    });

    const prevOtherExpenses = await Expense.findOne({
      attributes: [[fn('SUM', col('amount')), 'totalExpenses']],
      where: {
        date: { [Op.between]: [prevStart, prevEnd] }
      },
      raw: true
    });

    // ===== CALCULATE METRICS =====
    
    const currentRevenue = parseFloat(revenueData?.totalRevenue || 0);
    const currentDiesel = parseFloat(dieselExpenses?.totalDiesel || 0);
    const currentExpenses = parseFloat(otherExpenses?.totalExpenses || 0);
    const currentTotalOutgoing = currentDiesel + currentExpenses;
    const currentNetProfit = currentRevenue - currentTotalOutgoing;
    const currentProfitMargin = currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;

    const previousRevenue = parseFloat(prevRevenueData?.totalRevenue || 0);
    const previousDiesel = parseFloat(prevDieselExpenses?.totalDiesel || 0);
    const previousExpenses = parseFloat(prevOtherExpenses?.totalExpenses || 0);
    const previousTotalOutgoing = previousDiesel + previousExpenses;
    const previousNetProfit = previousRevenue - previousTotalOutgoing;

    const totalPaid = parseFloat(paymentsData?.totalPaid || 0);
    const totalPending = parseFloat(paymentsData?.totalPending || 0);

    // ===== CALCULATE TRENDS =====
    
    const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);
    const expenseChange = calculatePercentageChange(currentTotalOutgoing, previousTotalOutgoing);
    const profitChange = calculatePercentageChange(currentNetProfit, previousNetProfit);
    const profitMarginChange = calculatePercentageChange(currentProfitMargin, 
      previousRevenue > 0 ? (previousNetProfit / previousRevenue) * 100 : 0
    );

    // ===== BUILD RESPONSE =====
    
    const summary = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
        trend: revenueChange >= 0 ? 'up' : 'down'
      },
      deposits: {
        current: totalPaid,
        outstanding: totalPending
      },
      outgoing: {
        current: currentTotalOutgoing,
        previous: previousTotalOutgoing,
        change: expenseChange,
        trend: expenseChange >= 0 ? 'up' : 'down',
        breakdown: {
          diesel: currentDiesel,
          other: currentExpenses
        }
      },
      profit: {
        current: currentNetProfit,
        previous: previousNetProfit,
        change: profitChange,
        trend: profitChange >= 0 ? 'up' : 'down',
        margin: currentProfitMargin,
        marginChange: profitMarginChange
      },
      operations: {
        tripCount: parseInt(tripStats?.tripCount || 0),
        invoiceCount: parseInt(revenueData?.invoiceCount || 0),
        dieselLitres: parseFloat(dieselExpenses?.totalLitres || 0)
      }
    };

    res.json({
      success: true,
      period: {
        mode,
        start: startDate,
        end: endDate,
        previous: { start: prevStart, end: prevEnd }
      },
      summary
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};

// ==================== REVENUE TREND ====================

export const getRevenueTrend = async (req, res) => {
  try {
    const { mode = 'monthly', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRange(mode, customStart, customEnd);

    let groupByFormat, groupByField;
    
    switch (mode) {
      case 'daily':
        groupByFormat = '%Y-%m-%d';
        groupByField = 'date';
        break;
      case 'weekly':
        groupByFormat = '%Y-Week-%U';
        groupByField = 'week';
        break;
      default:
        groupByFormat = '%Y-%m';
        groupByField = 'month';
    }

    const trendData = await Invoice.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('invoice_date'), groupByFormat), groupByField],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('COUNT', col('invoice_id')), 'count']
      ],
      where: {
        invoice_date: { [Op.between]: [startDate, endDate] }
      },
      group: [fn('DATE_FORMAT', col('invoice_date'), groupByFormat)],
      order: [[fn('DATE_FORMAT', col('invoice_date'), groupByFormat), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: trendData.map(item => ({
        period: item[groupByField],
        revenue: parseFloat(item.revenue || 0),
        count: parseInt(item.count || 0)
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching revenue trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trend',
      error: error.message
    });
  }
};

// ==================== EXPENSE BREAKDOWN ====================

export const getExpenseBreakdown = async (req, res) => {
  try {
    const { mode = 'monthly', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRange(mode, customStart, customEnd);

    // Diesel expenses
    const dieselTotal = await DriverExpense.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'total']],
      where: { date: { [Op.between]: [startDate, endDate] } },
      raw: true
    });

    // Other expenses by category
    const expensesByCategory = await Expense.findAll({
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total']
      ],
      where: { date: { [Op.between]: [startDate, endDate] } },
      group: ['category'],
      raw: true
    });

    const breakdown = [
      {
        category: 'Diesel & Fuel',
        amount: parseFloat(dieselTotal?.total || 0),
        color: '#667eea'
      },
      ...expensesByCategory.map(exp => ({
        category: exp.category || 'Other',
        amount: parseFloat(exp.total || 0),
        color: '#f093fb'
      }))
    ];

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      success: true,
      data: breakdown.map(item => ({
        ...item,
        percentage: total > 0 ? (item.amount / total) * 100 : 0
      })),
      total
    });

  } catch (error) {
    console.error('❌ Error fetching expense breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense breakdown',
      error: error.message
    });
  }
};

// ==================== CASH FLOW TIMELINE ====================

export const getCashFlow = async (req, res) => {
  try {
    const { mode = 'monthly', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRange(mode, customStart, customEnd);

    let groupByFormat;
    
    switch (mode) {
      case 'daily':
        groupByFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupByFormat = '%Y-Week-%U';
        break;
      default:
        groupByFormat = '%Y-%m';
    }

    // Inflow from invoices
    const inflow = await Invoice.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('invoice_date'), groupByFormat), 'period'],
        [fn('SUM', col('total_amount')), 'amount']
      ],
      where: { invoice_date: { [Op.between]: [startDate, endDate] } },
      group: [fn('DATE_FORMAT', col('invoice_date'), groupByFormat)],
      raw: true
    });

    // Outflow from expenses
    const outflowExpenses = await Expense.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('date'), groupByFormat), 'period'],
        [fn('SUM', col('amount')), 'amount']
      ],
      where: { date: { [Op.between]: [startDate, endDate] } },
      group: [fn('DATE_FORMAT', col('date'), groupByFormat)],
      raw: true
    });

    const outflowDiesel = await DriverExpense.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('date'), groupByFormat), 'period'],
        [fn('SUM', col('total_amount')), 'amount']
      ],
      where: { date: { [Op.between]: [startDate, endDate] } },
      group: [fn('DATE_FORMAT', col('date'), groupByFormat)],
      raw: true
    });

    // Merge data
    const periods = new Set([
      ...inflow.map(i => i.period),
      ...outflowExpenses.map(o => o.period),
      ...outflowDiesel.map(o => o.period)
    ]);

    const cashFlowData = Array.from(periods).sort().map(period => {
      const inflowItem = inflow.find(i => i.period === period);
      const outflowExpItem = outflowExpenses.find(o => o.period === period);
      const outflowDieselItem = outflowDiesel.find(o => o.period === period);

      const inflowAmt = parseFloat(inflowItem?.amount || 0);
      const outflowAmt = parseFloat(outflowExpItem?.amount || 0) + parseFloat(outflowDieselItem?.amount || 0);
      const netFlow = inflowAmt - outflowAmt;

      return {
        period,
        inflow: inflowAmt,
        outflow: outflowAmt,
        netFlow
      };
    });

    res.json({
      success: true,
      data: cashFlowData
    });

  } catch (error) {
    console.error('❌ Error fetching cash flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cash flow',
      error: error.message
    });
  }
};

// ==================== TOP CONTRIBUTORS ====================

export const getTopContributors = async (req, res) => {
  try {
    const { mode = 'monthly', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRange(mode, customStart, customEnd);

    // Top earning clients
    const topClients = await Invoice.findAll({
      attributes: [
        'client_id',
        [fn('SUM', col('total_amount')), 'totalRevenue'],
        [fn('COUNT', col('invoice_id')), 'invoiceCount']
      ],
      include: [{
        model: Client,
        as: 'client',
        attributes: ['client_name']
      }],
      where: { invoice_date: { [Op.between]: [startDate, endDate] } },
      group: ['client_id'],
      order: [[fn('SUM', col('total_amount')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });

    // Highest cost drivers (diesel expenses)
    const topDrivers = await DriverExpense.findAll({
      attributes: [
        'driver_id',
        [fn('SUM', col('total_amount')), 'totalCost'],
        [fn('SUM', col('litres')), 'totalLitres']
      ],
      include: [{
        model: Driver,
        as: 'driver',
        attributes: ['name']
      }],
      where: { date: { [Op.between]: [startDate, endDate] } },
      group: ['driver_id'],
      order: [[fn('SUM', col('total_amount')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });

    res.json({
      success: true,
      topClients: topClients.map(c => ({
        clientId: c.client_id,
        clientName: c.client?.client_name || 'Unknown',
        revenue: parseFloat(c.totalRevenue || 0),
        invoiceCount: parseInt(c.invoiceCount || 0)
      })),
      topDrivers: topDrivers.map(d => ({
        driverId: d.driver_id,
        driverName: d.driver?.name || 'Unknown',
        cost: parseFloat(d.totalCost || 0),
        litres: parseFloat(d.totalLitres || 0)
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching top contributors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top contributors',
      error: error.message
    });
  }
};

// ==================== AUTO-GENERATED INSIGHTS ====================

export const getInsights = async (req, res) => {
  try {
    const { mode = 'monthly', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRange(mode, customStart, customEnd);
    const { prevStart, prevEnd } = getPreviousPeriodRange(mode, startDate, customStart, customEnd);

    const insights = [];

    // Fetch current and previous data
    const currentData = await Invoice.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'revenue']],
      where: { invoice_date: { [Op.between]: [startDate, endDate] } },
      raw: true
    });

    const previousData = await Invoice.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'revenue']],
      where: { invoice_date: { [Op.between]: [prevStart, prevEnd] } },
      raw: true
    });

    const currentDiesel = await DriverExpense.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'diesel']],
      where: { date: { [Op.between]: [startDate, endDate] } },
      raw: true
    });

    const previousDiesel = await DriverExpense.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'diesel']],
      where: { date: { [Op.between]: [prevStart, prevEnd] } },
      raw: true
    });

    const pendingPayments = await Payment.findOne({
      attributes: [[fn('SUM', col('balanceAmount')), 'pending']],
      raw: true
    });

    const currentRevenue = parseFloat(currentData?.revenue || 0);
    const previousRevenue = parseFloat(previousData?.revenue || 0);
    const currentDieselAmt = parseFloat(currentDiesel?.diesel || 0);
    const previousDieselAmt = parseFloat(previousDiesel?.diesel || 0);
    const pendingAmt = parseFloat(pendingPayments?.pending || 0);

    // Generate insights
    const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);
    const dieselChange = calculatePercentageChange(currentDieselAmt, previousDieselAmt);

    if (Math.abs(revenueChange) > 10) {
      insights.push({
        type: revenueChange > 0 ? 'success' : 'warning',
        title: revenueChange > 0 ? 'Revenue Growth' : 'Revenue Decline',
        message: `Revenue ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% compared to previous period`,
        severity: revenueChange > 0 ? 'positive' : 'negative'
      });
    }

    if (Math.abs(dieselChange) > 15) {
      insights.push({
        type: 'warning',
        title: 'Fuel Expense Alert',
        message: `Diesel expenses ${dieselChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(dieselChange).toFixed(1)}% this period`,
        severity: dieselChange > 0 ? 'negative' : 'positive'
      });
    }

    if (pendingAmt > 100000) {
      insights.push({
        type: 'alert',
        title: 'High Outstanding Payments',
        message: `Outstanding payments have reached ₹${pendingAmt.toLocaleString()}. Consider following up with clients`,
        severity: 'negative'
      });
    }

    const profitMargin = currentRevenue > 0 ? ((currentRevenue - currentDieselAmt) / currentRevenue) * 100 : 0;
    if (profitMargin < 20 && currentRevenue > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Profit Margin',
        message: `Profit margin is ${profitMargin.toFixed(1)}%, which is below the healthy range of 20%+`,
        severity: 'negative'
      });
    }

    if (revenueChange > 5) {
      insights.push({
        type: 'success',
        title: 'Strong Performance',
        message: `This period is performing ${revenueChange.toFixed(1)}% better than the previous period`,
        severity: 'positive'
      });
    }

    // If no specific insights, add a general one
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Stable Operations',
        message: 'Operations are running smoothly with no major fluctuations detected',
        severity: 'neutral'
      });
    }

    res.json({
      success: true,
      insights,
      generated: new Date()
    });

  } catch (error) {
    console.error('❌ Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
};
