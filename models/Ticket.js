import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Customer from './Customer.js';
import User from './User.js';

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please provide subject'
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
    type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  messages: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
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
  tableName: 'tickets',
  timestamps: true,
  hooks: {
    beforeValidate: async (ticket) => {
      if (!ticket.ticketNumber) {
        try {
          const TicketModel = sequelize.models.Ticket || Ticket;
          const count = await TicketModel.count();
          const year = new Date().getFullYear();
          ticket.ticketNumber = `TKT-${year}-${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
          // Fallback: use timestamp if count fails
          const timestamp = Date.now().toString().slice(-6);
          ticket.ticketNumber = `TKT-${new Date().getFullYear()}-${timestamp}`;
        }
      }
    }
  }
});

// Define associations
Ticket.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Ticket.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

export default Ticket;
