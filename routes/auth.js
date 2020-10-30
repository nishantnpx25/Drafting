const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

//for reset password
const crypto = require("crypto");

//making user model (the name should be same as in user.js)
const User = mongoose.model("User");

//for hashing passwords
const bcrypt = require("bcryptjs");

//for giving user token after signing in
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../keys");

//constant to use middleware
const requiredLogin = require("../middleware/requiredLogin");

//for sending emails to user
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: "yourApiKey",
    },
  })
);

router.get("/", (req, res) => {
  res.send("Home page");
});

//signup route
router.post("/signup", (req, res) => {
  const { name, email, password, pic } = req.body;

  //checking whether any field is null or not
  if (!email || !password || !name) {
    //if found null, return error with a status code 422 which means server
    //understood the request but cannot process it
    return res.status(422).json({ error: "please add all the fields" });
  }
  User.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        return res
          .status(422)
          .json({ error: "user already exists with that email" });
      }
      //encrypting password with length 12 and then creating user
      bcrypt.hash(password, 12).then((hashedpassword) => {
        const user = new User({
          email,
          password: hashedpassword,
          name,
          pic,
        });
        user
          .save()
          .then((user) => {
            //sending mail to user when signed up succesfully
            transporter.sendMail({
              to: user.email,
              from: "nishant.pandey.17cse@bml.edu.in",
              subject: "Signup Successfull",
              html:
                "<h1>Welcome to Drafting, World's largest cycling community</h1>",
            });
            res.json({ message: "saved successfully" });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

//signin route
router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(422)
      .json({ error: "please provide with the credentials" });
  }
  User.findOne({ email: email }).then((savedUser) => {
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid email or password" });
    }

    //comparing password getting from client to the one in database
    //then signing in based on response
    bcrypt
      .compare(password, savedUser.password)
      .then((doMatch) => {
        if (doMatch) {
          //res.json({ message: "successfully signed in" });
          //using JWT
          const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET);
          const { _id, name, email, followers, following, pic } = savedUser;
          res.json({
            token,
            user: { _id, name, email, followers, following, pic },
          });
        } else {
          return res.status(422).json({ error: "Invalid email or password" });
        }
      })
      //the following catch is for our debugging and not at client's end
      .catch((err) => {
        console.log(err);
      });
  });
});

//generating reset password token
router.post("/reset-password", (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        return res.status(422).json({ error: "User does not exists" });
      }
      user.resetToken = token;
      user.expireToken = Date.now() + 3600000;
      user.save().then((result) => {
        transporter.sendMail({
          to: user.email,
          from: "nishant.pandey.17cse@bml.edu.in",
          subject: "Password reset link for drafting",
          html: `
          <p>Your request for password reset is accepted</p>
          <h5> Click on the <a href="http://localhost:3000/reset/${token}">link </a> to reset your password</h5>
          `,
        });
        res.json({ message: "Check your email for reset link" });
      });
    });
  });
});

//reset password route
router.post("/new-password", (req, res) => {
  const newPassword = req.body.password;
  const sentToken = req.body.token;
  User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ error: "Session expired" });
      }
      bcrypt.hash(newPassword, 12).then((hashedpassword) => {
        user.password = hashedpassword;
        user.resetToken = undefined;
        user.expireToken = undefined;
        user
          .save()
          .then((savedUser) =>
            res.json({ message: "Password Updation Successfull" })
          );
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// //creating middleware to verify token
// router.get("/protected", requiredLogin, (req, res) => {
//   res.send('"hello user');
// });

//for exporting to be used by another file
module.exports = router;
