import express from 'express';
import {
  getDashboardAnalytics,
  getRevenueTrend,
  getExpenseBreakdown,
  getCashFlow,
  getTopContributors,
  getInsights
} from '../controllers/dashboardAnalyticsController.js';

const router = express.Router();

// Main dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Revenue trend over time
router.get('/revenue-trend', getRevenueTrend);

// Expense breakdown by category
router.get('/expense-breakdown', getExpenseBreakdown);

// Cash flow timeline (inflow vs outflow)
router.get('/cash-flow', getCashFlow);

// Top contributors (clients, drivers, vehicles)
router.get('/top-contributors', getTopContributors);

// Auto-generated insights
router.get('/insights', getInsights);

export default router;
