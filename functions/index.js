const functions = require("firebase-functions");
const admin = require("firebase-admin");

// intialize app
admin.initializeApp();

const express = require("express");
const app = express();
const firebase = require("firebase");
const { check, validationResult } = require("express-validator");
// const dotenv = require("dotenv");

// dotenv.config();

firebase.initializeApp({
  apiKey: "AIzaSyA3qHvpWaaziN0matBTKEi9ZLlXuPA6hfI",
  authDomain: "mama-bear-d07e8.firebaseapp.com",
  databaseURL: "https://mama-bear-d07e8.firebaseio.com",
  projectId: "mama-bear-d07e8",
  storageBucket: "mama-bear-d07e8.appspot.com",
  messagingSenderId: "345721970427",
  appId: "1:345721970427:web:884f62f19911de7833da5e",
});

// fetch screams
app.get("/screams", (req, res) => {
  admin
    .firestore()
    .collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((dataSnapshot) => {
      let screams = [];
      dataSnapshot.forEach((doc) =>
        screams.push({
          id: doc.id,
          ...doc.data(),
        })
      );
      res.json(screams);
    })
    .catch((err) => console.log(err));
});

// create a scream
app.post("/createScream", (req, res) => {
  const { userHandle, body } = req.body;
  const newScream = {
    userHandle,
    body,
    createdAt: new Date().toISOString(),
  };

  admin
    .firestore()
    .collection("screams")
    .add(newScream)
    .then((docRef) =>
      res.json({
        message: `${docRef.id} created successfully`,
      })
    )
    .catch((err) => res.status(500).json({ err }));
});

// ======================== Sign up route====================================//
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
  (req, res) => {
    //  validation
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { userHandle, email, password, confirmPassword } = req.body;
    let userId = "";
    let token = "";

    // checking if user handle is taken
    admin
      .firestore()
      .doc(`/users/${userHandle}`)
      .get()
      .then((docSnapshot) => {
        if (docSnapshot.exists)
          return res
            .status(400)
            .json({ handle: `${userHandle} is already taken` });

        //else create user
        return firebase.auth().createUserWithEmailAndPassword(email, password);
      })
      .then((data) => {
        // return promise holding user data
        userId = data.user.uid;
        return data.user.getIdToken();
      })
      .then((_token) => {
        token = _token;
        // persisting newly created user to the users collection
        return admin.firestore().doc(`/users/${userHandle}`).set({
          userHandle,
          email,
          userId,
          createdAt: new Date().toISOString(),
        });
      })
      .then(() => res.status(201).json({ token }))
      .catch((err) => res.json({ err }));
  }
);

// Login route
// app.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   let token = "";

//   firebase
//     .auth()
//     .signInWithEmailAndPassword(email, password)
//     .then((data) => {
//       return data.user.getIdToken();
//     })
//     .then((_token) => res.json({ token }))
//     .catch((err) => res.json({ err }));
// });

// changing distance to closest server
exports.api = functions.region("europe-west3").https.onRequest(app);
