const functions = require("firebase-functions");
const admin = require("firebase-admin");

// intialize app
admin.initializeApp();

const express = require("express");
const app = express();
const env = require("./config");
const firebase = require("firebase");

firebase.initializeApp(env.firebaseConfig);

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

// Sign up route
app.post("/signup", (req, res) => {
  const { userHandle, email, password, confirmPassword } = req.body;

  // create user
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((data) => {
      res.status(201).json({ message: `${data.user.id} created succesfully` });
    })
    .catch((error) => res.status(500).json(error));
});
// changing distance to closest server
exports.api = functions.region("europe-west3").https.onRequest(app);
