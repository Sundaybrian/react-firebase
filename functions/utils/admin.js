const admin = require("firebase-admin");

// intialize app
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };
