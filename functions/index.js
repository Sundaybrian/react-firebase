const functions = require("firebase-functions");
const { db } = require("./utils/admin");
const express = require("express");
const app = express();
const { check } = require("express-validator");

const {
  getAllScreams,
  postOneScream,
  getOneScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./routes/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require("./routes/users");
const auth = require("./utils/auth");

// ********************************scream routes****************//
app.get("/screams", getAllScreams);
app.post("/createScreams", auth, postOneScream);
app.get("/screams/:id", getOneScream);
app.post(
  "/screams/:id/comment",
  [[check("body").not().isEmpty()], auth],
  commentOnScream
);
app.get("/screams/:id/like", auth, likeScream);
app.get("/screams/:id/unlike", auth, unlikeScream);
app.delete("/screams/:id", auth, deleteScream);

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

app.post("/user/uploadImage", auth, uploadImage);
app.post("/user/addUserDetails", auth, addUserDetails);
app.get("/user/getAuthenticatedUser", auth, getAuthenticatedUser);

// changing distance to closest server
exports.api = functions.region("europe-west3").https.onRequest(app);

// notifications with database triggers !!!! //
exports.createNotificationOnLike = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onCreate((likeSnapshot) => {
    // fetch the scream
    db.doc(`screams/${likeSnapshot.doc.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          // create the notifications
          return db.doc(`notifications/${likeSnapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: likeSnapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((error) => {
        console.error(error);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("europe-west3")
  .firestore.document("comments/{id}")
  .onCreate((commentSnapshot) => {
    db.doc(`screams/${commentSnapshot.doc.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`notifications/${commentSnapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: commentSnapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((error) => {
        console.error(error);
        return;
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("europe-west3")
  .firestore.document("likes/${id}")
  .onDelete((likeSnapshot) => {
    db.doc(`notifications/${likeSnapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((error) => {
        console.error(error);
        return;
      });
  });
