var express = require("express");
var index = require("./db/index");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const secret = require("./service/key");
const app = express();
const mongoose = require("mongoose");
var cors = require("cors");
//const Student =require("./db/studentmodel")
// const passport = require('passport');
app.use(flash());
app.use(express.static("public"));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
  );
  res.setHeader("Cache-Control", "no-cache");
  next();
});

app.use(
  session({
    secret: secret.sessionsecret
  })
);
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(
    "mongodb+srv://puneetjyot:handshake@handshake-mongo-zu6wh.mongodb.net/Handshake?retryWrites=true&w=majority",
    {
      useNewUrlParser: true
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.log("Failed to connect to MongoDB");
    console.log(err);
  });
app.use(passport.initialize());
app.use(passport.session());
app.use("/donor", require("./routes/studentRoutes"));
app.use("/student/experience", require("./routes/studentexperience"));
app.use("/company", require("./routes/companyRoutes"));
app.use("/jobs", require("./routes/fundraiserRoute"));
app.use("/events", require("./routes/eventRoute"));
app.use("/student/profile", require("./routes/profileRoute"));
app.use("/student/message", require("./routes/messageRoute"));
app.use(
  "/donor/trendingFundraisers",
  require("./routes/trendingFundraiserRoute")
);

module.exports = app;
// app.listen(3001);
