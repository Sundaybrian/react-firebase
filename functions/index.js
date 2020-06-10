const functions = require("firebase-functions");

const express = require("express");
const app = express();
const { check } = require("express-validator");

const { getAllScreams, postOneScream } = require("./routes/screams");
const { signup, login, uploadImage } = require("./routes/users");
const auth = require("./utils/auth");

// ********************************scream routes****************//
app.get("/screams", getAllScreams);
app.post("/createScreams", auth, postOneScream);
// TODO:

// **********************user routes**********************//
app.post(
  "/signup",
  [
    check("email", "enter a valid email").isEmail(),
    check("userHandle", "user handle is requires").not().isEmpty(),
    check("password", "enter password with 8 or more characters")
      .exists()
      .isLength({ min: 8, max: 255 }),
    check("confirmPassword", "confirm password is required")
      .exists()
      .isLength({ min: 8, max: 255 }),
  ],
  signup
);

// Login route
app.post(
  "/login",
  [
    check("email", "enter valid email").isEmail(),
    check("password", "password is required").exists(),
  ],
  login
);

app.post("/uploadImage", auth, uploadImage);

// changing distance to closest server
exports.api = functions.region("europe-west3").https.onRequest(app);
