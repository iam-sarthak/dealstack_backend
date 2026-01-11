import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Customer from './Customer.js';
import User from './User.js';

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
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
    type: DataTypes.ENUM('draft', 'pending', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'pending'
  },
  issueDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  paidDate: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'invoices',
  timestamps: true,
  hooks: {
    beforeValidate: async (invoice) => {
      if (!invoice.invoiceNumber) {
        try {
          const InvoiceModel = sequelize.models.Invoice || Invoice;
          const count = await InvoiceModel.count();
          const year = new Date().getFullYear();
          invoice.invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
          // Fallback: use timestamp if count fails
          const timestamp = Date.now().toString().slice(-6);
          invoice.invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}`;
        }
      }
    }
  }
});

// Define associations
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

export default Invoice;
