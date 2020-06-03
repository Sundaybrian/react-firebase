const functions = require("firebase-functions");
const admin = require("firebase-admin");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.getScreams = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection("screams")
    .get()
    .then((dataSnapshot) => {
      let screams = [];
      dataSnapshot.forEach((data) => screams.push(data.data()));
      res.json(screams);
    })
    .catch((err) => console.log(err));
});
