const { db, admin } = require("../utils/admin");
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
  const defaultImg = "default_profile.png";

  // checking if user handle is taken
  db.doc(`/users/${userHandle}`)
    .get()
    .then((doc) => {
      if (doc.exists)
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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImg}?alt=media`,
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

// upload image
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const { v4: uuidv4 } = require("uuid");

  const busboy = new BusBoy({ headers: req.headers });
  let imageFileName;
  let imageUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "wrong file type" });
    }

    const imageExtension = filename.split(".")[filename.split(".").length - 1]; // grab image extesion
    imageFileName = `${uuidv4()}.${imageExtension}`; // create a name
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    // upload image
    admin
      .storage()
      .bucket()
      .upload(imageUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageUploaded.mimetype,
          },
        },
      })
      .then(() => {
        // save the image to the user doc
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;

        return db.doc(`/users/${req.user.userHandle}`).update({ imageUrl });
      })
      .then(() => {
        res.json({ message: "Image uploaded succesfully" });
      })
      .catch((err) => res.json({ err }));
  });

  busboy.end(req.rawBody);
};
