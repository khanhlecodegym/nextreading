import mongoose from 'mongoose';

import { DATABASE_URL } from './envVars';

const connectDb = () => {
  return mongoose.connect(DATABASE_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
    .then(() => {
      console.log('Database connected');
    })
    .catch(err => {
      console.log('Error connecting to database: ', err);
    });
};

export { connectDb };
