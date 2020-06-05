const { db } = require("../utils/admin");
const firebase = require("firebase");
const config = require("../utils/config");
firebase.initializeApp(config);

const { validationResult } = require("express-validator");

exports.signup = (req, res) => {
  //  validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { userHandle, email, password, confirmPassword } = req.body;
  let userId = "";
  let token = "";

  // checking if user handle is taken
  db.doc(`/users/${userHandle}`)
    .get()
    .then((docSnapshot) => {
      if (docSnapshot.exists)
        return res
          .status(400)
          .json({ error: `${userHandle} is already taken` });

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
      return db.doc(`/users/${userHandle}`).set({
        userHandle,
        email,
        userId,
        createdAt: new Date().toISOString(),
      });
    })
    .then(() => res.status(201).json({ token }))
    .catch((err) => res.json({ err }));
};

exports.login = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;
  let token = "";

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => res.json({ token }))
    .catch((err) => res.json({ err }));
};
