import express from 'express';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import Customer from '../models/Customer.js';
import Worksheet from '../models/Worksheet.js';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Ticket from '../models/Ticket.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Helper function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };

    // Get current stats
    const [
      totalCustomersCurrent,
      activeWorksheetsCurrent,
      pendingInvoicesCurrent,
      activeOrdersCurrent
    ] = await Promise.all([
      Customer.count(),
      Worksheet.count({ where: { status: { [Op.in]: ['pending', 'in-progress'] } } }),
      Invoice.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: { [Op.in]: ['pending', 'processing', 'shipped'] } } })
    ]);

    // Get previous month end stats (counts at the end of last month)
    const [
      totalCustomersPrevious,
      activeWorksheetsPrevious,
      pendingInvoicesPrevious,
      activeOrdersPrevious
    ] = await Promise.all([
      // Total customers at end of last month
      Customer.count({
        where: {
          createdAt: {
            [Op.lte]: previousMonthEnd
          }
        }
      }),
      // Active worksheets at end of last month (approximation: worksheets created before this month that are still active)
      Worksheet.count({
        where: {
          createdAt: {
            [Op.lte]: previousMonthEnd
          },
          status: { [Op.in]: ['pending', 'in-progress'] }
        }
      }),
      // Pending invoices at end of last month
      Invoice.count({
        where: {
          status: 'pending',
          createdAt: {
            [Op.lte]: previousMonthEnd
          }
        }
      }),
      // Active orders at end of last month
      Order.count({
        where: {
          status: { [Op.in]: ['pending', 'processing', 'shipped'] },
          createdAt: {
            [Op.lte]: previousMonthEnd
          }
        }
      })
    ]);

    // Calculate percentage changes
    const customerChange = calculatePercentageChange(totalCustomersCurrent, totalCustomersPrevious);
    const worksheetChange = calculatePercentageChange(activeWorksheetsCurrent, activeWorksheetsPrevious);
    const invoiceChange = calculatePercentageChange(pendingInvoicesCurrent, pendingInvoicesPrevious);
    const orderChange = calculatePercentageChange(activeOrdersCurrent, activeOrdersPrevious);

    // Get additional stats
    const [
      totalRevenueResult,
      paidInvoicesResult,
      completedOrders,
      openTickets
    ] = await Promise.all([
      Invoice.sum('total', { where: { status: { [Op.ne]: 'cancelled' } } }),
      Invoice.sum('total', { where: { status: 'paid' } }),
      Order.count({ where: { status: 'completed' } }),
      Ticket.count({ where: { status: { [Op.in]: ['open', 'in-progress'] } } })
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers: totalCustomersCurrent,
        totalCustomersChange: customerChange,
        activeWorksheets: activeWorksheetsCurrent,
        activeWorksheetsChange: worksheetChange,
        pendingInvoices: pendingInvoicesCurrent,
        pendingInvoicesChange: invoiceChange,
        activeOrders: activeOrdersCurrent,
        activeOrdersChange: orderChange,
        totalRevenue: parseFloat(totalRevenueResult || 0),
        paidInvoices: parseFloat(paidInvoicesResult || 0),
        completedOrders,
        openTickets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/dashboard/recent
// @desc    Get recent activities
// @access  Private
router.get('/recent', async (req, res) => {
  try {
    const [recentInvoices, recentOrders, recentCustomers, recentTickets] = await Promise.all([
      Invoice.findAll({
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Order.findAll({
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Customer.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Ticket.findAll({
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['name']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    const activities = [
      ...recentInvoices.map(inv => ({
        type: 'invoice',
        message: `New invoice ${inv.invoiceNumber} created`,
        time: inv.createdAt
      })),
      ...recentOrders.map(ord => ({
        type: 'order',
        message: `Order ${ord.orderNumber} ${ord.status === 'completed' ? 'completed' : 'created'}`,
        time: ord.createdAt
      })),
      ...recentCustomers.map(cust => ({
        type: 'customer',
        message: 'New customer registered',
        time: cust.createdAt
      })),
      ...recentTickets.map(tkt => ({
        type: 'ticket',
        message: tkt.status === 'resolved' ? `Support ticket ${tkt.ticketNumber} resolved` : `New ticket ${tkt.ticketNumber} created`,
        time: tkt.createdAt
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
