
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); 


const connectDB = require('./config/db');
const topicRoutes = require('./Routes/Topic'); 
const questionRoutes = require('./Routes/Question'); 

dotenv.config(); 
connectDB();
const app = express();

app.use(cors()); 

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/questions', questionRoutes);

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(buildPath));


  app.get('*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
} else {

  app.get('/', (req, res) => {
    res.send('API is running in development mode...');
  });
}

const PORT = process.env.PORT || 5001;

const server = app.listen(
    PORT,
    () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
    server.close(() => process.exit(1));
});
