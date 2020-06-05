const { admin, db } = require("./admin");

module.exports = (req, res, next) => {
  let token = req.headers.authorization;
  console.log(token);

  // check if token exists
  if (!token) {
    return res.status(403).json({ error: "Authorization denied" });
  }

  // verifying token
  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      // adding a user propertie to the req obj
      req.user = decodedToken;

      // calling the collections and fetching the user handle
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((dataSnapshot) => {
      // adding a userHandle to the user obj
      req.user.userHandle = dataSnapshot.docs[0].data().userHandle;
      return next();
    })
    .catch((err) => res.status(403).json(err));
};
