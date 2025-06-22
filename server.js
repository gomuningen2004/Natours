import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

import { app } from './app.js';

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
