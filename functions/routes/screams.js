const { db } = require("../utils/admin");
const { validationResult } = require("express-validator");

exports.getAllScreams = (req, res) => {
  db.collection("screams")
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
};

exports.postOneScream = (req, res) => {
  const { body } = req.body;
  const newScream = {
    userHandle: req.user.userHandle,
    userImage: req.user.imageUrl,
    body,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  // add post
  db.collection("screams")
    .add(newScream)
    .then((doc) => res.status(201).json({ ...newScream, id: doc.id }))
    .catch((err) => res.status(500).json(err));
};

// get one scream
exports.getOneScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.id}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(400).json({ error: "scream does not exist" });
      }

      screamData = doc.data();
      screamData.screamId = doc.id;

      // fetch comments
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamId", "==", req.params.id)
        .get();
    })
    .then((data) => {
      screamData.comments = [];

      data.forEach((doc) => screamData.comments.push(doc.data()));

      return res.status(200).json(screamData);
    })
    .catch((error) => res.status(500).json({ error }));
};

// commment on a scream
exports.commentOnScream = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const screamId = req.params.id;
  const { body } = req.body;

  const newComment = {
    userHandle: req.user.userHandle,
    imageUrl: req.user.imageUrl,
    body,
    screamId,
    createdAt: new Date().toISOString(),
  };

  db.collection("comments")
    .add(newComment)
    .then(() => res.status(201).json(newComment))
    .catch((error) => res.status(500).json(error));
};

// like a scream
exports.likeScream = (req, res) => {
  const newLike = {
    userHandle: req.user.userHandle,
    screamId: req.params.id,
  };

  db.collection("likes")
    .add(newLike)
    .then(() => {})
    .catch((error) => res.status(500).json(error));
};
