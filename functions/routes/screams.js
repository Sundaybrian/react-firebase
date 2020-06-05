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
