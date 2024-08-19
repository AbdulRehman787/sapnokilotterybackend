const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser');
const cors = require('cors')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

app.use(cors())


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: '',
    database: 'sapnokilottery'
})

db.connect(function(err){
    if(err) throw err;
    console.log('Database Connected')
})

const port = 3001


app.get('/',(req,res)=>{
    res.send('Hello World')
})





app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if the email exists in the database
    const sql = "SELECT * FROM `user` WHERE `email` = ?";
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            // Email does not exist
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const user = results[0];

        // Compare the provided password with the hashed password in the database
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (!isMatch) {
                // Password does not match
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // Successful login
            return res.status(200).json({ message: "Login successful" });
        });
    });
});



app.post('/forgotpassword', (req, res) => {
    const { email } = req.body;

    // Check if the email exists in the database
    const sql = "SELECT * FROM `user` WHERE `email` = ?";
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            // Email does not exist
            return res.status(400).json({ message: "No account found with that email address." });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpire = Date.now() + 3600000; // Token expires in 1 hour

        // Store the reset token in the database
        const updateSql = "UPDATE `user` SET `reset_token` = ?, `reset_token_expire` = ? WHERE `email` = ?";
        db.query(updateSql, [resetToken, resetTokenExpire, email], (err) => {
            if (err) {
                console.error("Error setting reset token:", err);
                return res.status(500).json({ message: "Internal server error" });
            }

            // Send the reset link via email
            const resetLink = `https://your-domain.com/resetpassword?token=${resetToken}`;
            const mailOptions = {
                to: email,
                from: 'your_email@gmail.com',
                subject: 'Password Reset Request',
                text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                      `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                      `${resetLink}\n\n` +
                      `If you did not request this, please ignore this email and your password will remain unchanged.\n`
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    console.error("Error sending email:", err);
                    return res.status(500).json({ message: "Error sending the email" });
                }

                return res.status(200).json({ message: "Password reset link sent to your email" });
            });
        });
    });
});



app.post('/signup', async (req, res) => {
    const email = req.body.email;

    // First, check if the email already exists in the database
    const checkEmailSql = "SELECT * FROM `user` WHERE `email` = ?";
    db.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }

        if (results.length > 0) {
            // Email already exists
            return res.status(400).json({ message: "Email is already in use. Please try another email." });
        }

        // If the email doesn't exist, proceed to hash the password and insert the user
        const saltRounds = 10;
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ message: "Internal server error", error: err.message });
            }

            const sql = "INSERT INTO `user`(`name`, `email`, `phoneno`, `password`) VALUES (?, ?, ?, ?)";
            const values = [
                req.body.name,
                req.body.email,
                req.body.phoneno,
                hash
            ];

            db.query(sql, values, (err) => {
                if (err) {
                    console.error("Error adding user:", err);
                    return res.status(500).json({ message: "Internal server error", error: err.message });
                }
                return res.status(200).json({ message: "User added successfully" });
            });
        });
    });
  });

  app.get("/signup", (req, res) => {
    db.query("SELECT * FROM `user` ", (err, result, fields) => {
      if (err) {
        throw err;
      } else {
        res.send(result);
      }
    });
  });

  


  app.post('/update-profile', (req, res) => {
    const { name, email, phoneno, country, city } = req.body;
  
    const query = `UPDATE user SET name = ?, phoneno = ?, country = ?, city = ? WHERE email = ?`;
  
    db.query(query, [name, phoneno, country, city, email], (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred' });
      }
  
      if (results.affectedRows > 0) {
        return res.json({ success: true, message: 'Profile updated successfully' });
      } else {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    });
  }); 
  
app.listen(port,(err)=>{
    if(err) throw err
    console.log(`server is running on localhost:${port}`)
})