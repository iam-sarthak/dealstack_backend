import { Sequelize } from "sequelize";
import dns from "dns";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 2,      // VERY important for serverless
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
  retry: {
    max: 3,
  },
});

export default sequelize;
