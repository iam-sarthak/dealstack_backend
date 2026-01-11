import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const where = {};

    if (search) {
      where.orderNumber = { [Op.iLike]: `%${search}%` };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
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
      total: orders.length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    };

    res.json({
      success: true,
      count: orders.length,
      stats,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company', 'phone', 'location']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('type').isIn(['product', 'service']).withMessage('Type must be product or service'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('assignedTo').notEmpty().withMessage('Assigned to is required'),
  body('deliveryDate').isISO8601().withMessage('Please provide a valid delivery date')
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

    const order = await Order.create({
      ...req.body,
      items: calculatedItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      discount: finalDiscount,
      total,
      createdBy: req.user.id
    });

    const populatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
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
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
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
      req.body.total = calculatedSubtotal + (req.body.tax || parseFloat(order.tax)) - (req.body.discount || parseFloat(order.discount));
    }

    await order.update(req.body);

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
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
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ status: req.body.status });

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
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
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.destroy();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
