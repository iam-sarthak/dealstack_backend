import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Worksheet from '../models/Worksheet.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/worksheets
// @desc    Get all worksheets
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const worksheets = await Worksheet.findAll({
      where,
      include: [
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

    res.json({
      success: true,
      count: worksheets.length,
      data: worksheets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/worksheets/:id
// @desc    Get single worksheet
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const worksheet = await Worksheet.findByPk(req.params.id, {
      include: [
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

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      data: worksheet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/worksheets
// @desc    Create new worksheet
// @access  Private
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('assignedTo').notEmpty().withMessage('Assigned to is required'),
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

    const worksheet = await Worksheet.create({
      ...req.body,
      createdBy: req.user.id
    });

    const populatedWorksheet = await Worksheet.findByPk(worksheet.id, {
      include: [
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
      data: populatedWorksheet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/worksheets/:id
// @desc    Update worksheet
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const worksheet = await Worksheet.findByPk(req.params.id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    await worksheet.update(req.body);

    const updatedWorksheet = await Worksheet.findByPk(worksheet.id, {
      include: [
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
      data: updatedWorksheet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/worksheets/:id
// @desc    Delete worksheet
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const worksheet = await Worksheet.findByPk(req.params.id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    await worksheet.destroy();

    res.json({
      success: true,
      message: 'Worksheet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
