const express = require('express');
const router = express.Router();

const db = require("./util/db");

/**
 * Retrieves a logged in user's catalog
 */
 router.get("/", async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: "A user must be logged in to see their catalog" });
    }

    const catalog = await db.catalog.getByUserID(req.session.user.userID);
    return res.json(catalog);
});

module.exports = router;