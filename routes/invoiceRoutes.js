import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (search) {
      where.invoiceNumber = { [Op.iLike]: `%${search}%` };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate stats
    const stats = {
      total: invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      paid: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      pending: invoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
    };

    res.json({
      success: true,
      count: invoices.length,
      stats,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company', 'phone', 'location']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private
router.post('/', [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('dueDate').isISO8601().withMessage('Please provide a valid due date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { items, subtotal, tax, discount } = req.body;

    // Calculate totals for items
    const calculatedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const calculatedSubtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTax = tax || 0;
    const finalDiscount = discount || 0;
    const total = finalSubtotal + finalTax - finalDiscount;

    const invoice = await Invoice.create({
      ...req.body,
      items: calculatedItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      discount: finalDiscount,
      total,
      createdBy: req.user.id
    });

    const populatedInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Recalculate totals if items are updated
    if (req.body.items) {
      const calculatedItems = req.body.items.map(item => ({
        ...item,
        total: item.quantity * item.price
      }));
      const calculatedSubtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
      req.body.items = calculatedItems;
      req.body.subtotal = calculatedSubtotal;
      req.body.total = calculatedSubtotal + (req.body.tax || parseFloat(invoice.tax)) - (req.body.discount || parseFloat(invoice.discount));
    }

    await invoice.update(req.body);

    const updatedInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/invoices/:id/status
// @desc    Update invoice status
// @access  Private
router.put('/:id/status', [
  body('status').isIn(['draft', 'pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.update({
      status: req.body.status,
      ...(req.body.status === 'paid' && { paidDate: new Date() })
    });

    const updatedInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.destroy();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
