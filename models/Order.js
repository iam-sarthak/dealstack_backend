import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Customer from './Customer.js';
import User from './User.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Please provide customer'
      }
    }
  },
  type: {
    type: DataTypes.ENUM('product', 'service'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['product', 'service']],
        msg: 'Type must be product or service'
      },
      notNull: {
        msg: 'Please specify order type'
      }
    }
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('At least one item is required');
        }
      }
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Please provide delivery date'
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
  shippingAddress: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
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
  tableName: 'orders',
  timestamps: true,
  hooks: {
    beforeValidate: async (order) => {
      if (!order.orderNumber) {
        try {
          const OrderModel = sequelize.models.Order || Order;
          const count = await OrderModel.count();
          const year = new Date().getFullYear();
          order.orderNumber = `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
          // Fallback: use timestamp if count fails
          const timestamp = Date.now().toString().slice(-6);
          order.orderNumber = `ORD-${new Date().getFullYear()}-${timestamp}`;
        }
      }
    }
  }
});

// Define associations
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

export default Order;
