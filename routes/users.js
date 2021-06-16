var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');
const db = require("./util/db");

/**
 * Gets a logged in user's information 
 */
 router.get("/", async (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }

  return res.json({ loggedIn: true, user: req.session.user });
});

/**
 * Adds a new user to the database 
 */
router.post("/register", async (req, res) => {
  const user = req.body;

  if (!db.users.validate.username(user)) return res.json({ success: false, message: "Invalid/Missing username." });

  if (!db.users.validate.password(user)) return res.json({ success: false, message: "Invalid/Missing password." });

  if (!db.users.validate.emailAddress(user)) return res.json({ success: false, message: "Invalid/Missing email address." });

  if (!db.users.validate.firstName(user)) return res.json({ success: false, message: "Invalid/Missing first name." });

  if (!db.users.validate.lastName(user)) return res.json({ success: false, message: "Invalid/Missing last name." });

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  const { success } = await db.users.insert(user);

  if (!success) return res.json({ success, message: `Username: ${user.username}, is taken.` });

  res.json({ success, message: `Account created for user: ${user.username}.` });
});

/**
 * Logs in a user given valid credentials, then stores info. in session 
 */
router.get("/login", async (req, res) => {
  const user = req.query;

  if (!db.users.validate.username(user)) return res.json({ success: false, message: "Invalid/Missing username." });

  if (!db.users.validate.password(user)) return res.json({ success: false, message: "Invalid/Missing password." });

  const userSearchResults = await db.users.find.byUsername(user.username);

  const { success, error = null, data = [] } = userSearchResults;

  if (!success && error) {
    console.error(error);
    return res.json({ success, message: "Error querying the database." });
  }

  if (success && data.length === 0) {
    return res.json({ success: false, message: "No user with matching username found." });
  }

  const dbUser = data[0];

  let validPass = await bcrypt.compare(user.password, dbUser.PASSWORD);
  if (!validPass) {
    return res.json({ success: false, message: "Invalid credentials" });
  } 
  
  req.session.user = { 
    userID: dbUser.USER_ID, 
    username: dbUser.USERNAME, 
    firstName: dbUser.FIRST_NAME, 
    lastName: dbUser.LAST_NAME, 
    emailAddress: dbUser.EMAIL_ADDRESS 
  };

  return res.json({ success: true, message: "User logged in." });
});

/**
 * Logs a user out of the website.
 */
 router.get("/logout", async (req, res) => {
  delete req.session.user;

  if (!req.session.user) {
    return res.json({ success: true });
  }

  return res.json({ success: false });
});

/**
 * Updates user information
 */
 router.put('/update', async (req, res) => {
  // Ensure that a user is logged in 
  // and that all required parameters are present in the request body
  if (!req.session.user) {
    return res.json({ success: false, message: "A user must be logged in to update user information." });
  } else if (!req.body.username && !req.body.password && !req.body.emailAddress && !req.body.firstName && !req.body.lastName) {
    return res.json({ success: false, message: "Missing parameter(s): username, password, firstName, lastName, and/or emailAddress" });
  }

  // Perform updates for all user attributes provided in the query's body
  if (req.body.username) {
    const userUpdateUsernameResults = await db.users.update.username(req.session.user.userID, req.body.username);
    if (!userUpdateUsernameResults.success) return res.json({ success: false, message: "Could not update username." });
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);
    const userUpdatePasswordResults = await db.users.update.password(req.session.user.userID, password);
    if (!userUpdatePasswordResults.success) return res.json({ success: false, message: "Could not update password." });
  }

  if (req.body.firstName) {
    const userUpdateFirstNameResults = await db.users.update.firstName(req.session.user.userID, req.body.firstName);
    if (!userUpdateFirstNameResults.success) return res.json({ success: false, message: "Could not update first name." });
  }

  if (req.body.lastName) {
    const userUpdateLastNameResults = await db.users.update.lastName(req.session.user.userID, req.body.lastName);
    if (!userUpdateLastNameResults.success) return res.json({ success: false, message: "Could not update last name." });
  }

  if (req.body.emailAddress) {
    const userUpdateEmailAddressResults = await db.users.update.emailAddress(req.session.user.userID, req.body.emailAddress);
    if (!userUpdateEmailAddressResults.success) return res.json({ success: false, message: "Could not update email address." });
  }

  return res.json({ success: true, message: "User updates were made successfully." });
});

/**
 * Given a user is logged in, remove their account
 */
 router.delete('/remove', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, msg: "A user must be logged in to delete their account"});
  }

  const { success } = await db.users.remove(req.session.user.userID);
  delete req.session.user;

  return res.json({ success, message: `User was deleted: ${success}` });
});

module.exports = router;