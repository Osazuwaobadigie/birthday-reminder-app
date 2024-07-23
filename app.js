const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  dob: Date
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/add-user', async (req, res) => {
  const { username, email, dob } = req.body;
  const newUser = new User({ username, email, dob });
  await newUser.save();
  res.redirect('/');
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

cron.schedule('0 7 * * *', async () => {
  const today = new Date();
  const users = await User.find({
    dob: { $dayOfMonth: today.getDate(), $month: today.getMonth() + 1 }
  });

  users.forEach(user => {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Happy Birthday!',
      text: `Dear ${user.username},\n\nWishing you a very Happy Birthday! Have a great day!\n\nBest wishes,\nYour Company`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
