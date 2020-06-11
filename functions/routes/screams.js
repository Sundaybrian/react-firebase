const { db } = require("../utils/admin");

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
    body,
    createdAt: new Date().toISOString(),
  };

  // add post
  db.collection("screams")
    .add(newScream)
    .then((docRef) =>
      res.json({
        message: `${docRef.id} created successfully`,
      })
    )
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
  const screamId = req.params.id;
  const { body } = req.body;

  db.collection("comments")
    .add({
      userHandle: req.user.userHandle,
      imageUrl: req.user.imageUrl,
      body,
      screamId,
      createdAt: new Date().toISOString(),
    })
    .then((docRef) =>
      res.json({
        message: `comment ${docRef.id} posted successfully`,
      })
    )
    .catch((error) => res.status(500).json({ error }));
};
