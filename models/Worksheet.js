import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Worksheet = sequelize.define('Worksheet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please provide worksheet title'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please provide description'
      }
    }
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Please assign to a user'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please provide due date'
      }
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'worksheets',
  timestamps: true
});

// Define associations
Worksheet.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Worksheet.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

export default Worksheet;
