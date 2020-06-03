const functions = require("firebase-functions");
const admin = require("firebase-admin");

// intialize app
admin.initializeApp();

const app = require("express").express();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// fetch screams
app.get("/screams", (req, res) => {
  admin
    .firestore()
    .collection("screams")
    .get()
    .then((dataSnapshot) => {
      let screams = [];
      dataSnapshot.forEach((doc) => screams.push(doc.data()));
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
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
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

//
exports.api = functions.https.onRequest(app);
