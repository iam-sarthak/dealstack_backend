import sequelize from '../config/database.js';
import User from './User.js';
import Customer from './Customer.js';
import Worksheet from './Worksheet.js';
import Invoice from './Invoice.js';
import Order from './Order.js';
import Ticket from './Ticket.js';

// Initialize all models
const models = {
  User,
  Customer,
  Worksheet,
  Invoice,
  Order,
  Ticket
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export { models, syncDatabase };
export default models;

