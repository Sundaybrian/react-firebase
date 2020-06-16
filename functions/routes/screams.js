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

// post a scream
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

  db.doc(`/screams/${req.params.id}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "Scream does not exist!" });
      }
      // update scream comment count
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => res.status(201).json(newComment))
    .catch((error) => res.status(500).json(error));
};

// like a scream
exports.likeScream = (req, res) => {
  // check if like doc exist
  const likeDoc = db
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("screamId", "==", req.params.id)
    .limit(1);

  // get the scream to be liked
  const screamDoc = db.doc(`/screams/${req.params.id}`);

  let screamData = {};

  screamDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = { ...doc.data(), id: doc.id };
        return likeDoc.get();
      } else {
        // scream doesnt exist
        return res.status(404).json({ error: "scream not found" });
      }
    })
    .then((data) => {
      // return likeDoc.get();
      if (data.empty) {
        // no like
        // create it
        return db
          .collection("likes")
          .add({
            screamId: req.params.id,
            userHandle: req.user.userHandle,
          })
          .then(() => {
            screamData.likeCount++;
            return screamDoc.update({
              likeCount: screamData.likeCount,
            });
          })
          .then(() => {
            return res.json(screamData);
          });
      } else {
        // we have a like
        return res.status(400).json({ error: "scream already liked" });
      }
    })
    .catch((error) => res.status(500).json(error));
};

exports.unlikeScream = (req, res) => {
  // check if like doc exist
  const likeDoc = db
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("screamId", "==", req.params.id)
    .limit(1);

  // get the scream to be unliked
  const screamDoc = db.doc(`/screams/${req.params.id}`);

  let screamData = {};

  screamDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = { ...doc.data(), id: doc.id };
        return likeDoc.get();
      } else {
        // scream doesnt exist
        return res.status(404).json({ error: "scream not found" });
      }
    })
    .then((data) => {
      // return likeDoc.get();
      if (data.empty) {
        // no like
        // we cant unlike something we havent liked
        return res.status(400).json({ error: "scream not liked" });
      } else {
        // we found something we liked
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            // reduce number of likes in the scream data
            screamData.likeCount--;
            return screamDoc
              .update({ likeCount: screamData.likeCount })
              .then(() => {
                return res.json(screamData);
              });
          });
      }
    })
    .catch((error) => res.status(500).json(error));
};

// delete a scream
exports.deleteScream = (req, res) => {
  const { userHandle } = req.user;
  const screamId = req.params.id;
  const screamDoc = db.doc(`/screams/${screamId}`);

  screamDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        //check if user is owner
        if (doc.data().userHandle == userHandle) {
          return screamDoc.delete();
        }
        return res.status(403).json({ message: "request is forbidden" });
      } else {
        return res.status(404).json({ error: "scream does not exist" });
      }
    })
    .then(() => {
      res.json({ message: "Scream Deleted successfully" });
    })
    .catch((error) => res.status(500).json({ error }));
};
