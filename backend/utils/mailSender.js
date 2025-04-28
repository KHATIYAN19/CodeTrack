const nodemailer = require('nodemailer');
require("dotenv").config();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',  
    auth: {
       user: 'placementconnect9@gmail.com',  
       pass: 'vbxp xoql egds euuf'      
    }
  });
};

const sendMail = (toEmail, subject, text, htmlContent) => {
  const transporter = createTransporter();  

  const mailOptions = {
    from: 'placementconnect9@gmail.com',  
    to: toEmail,                 
    subject: subject,            
    text: text,  
    html: htmlContent  
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ', error);
    } else {
      console.log('Email sent successfully: ', info.response);
    }
  });
};

module.exports = sendMail;
