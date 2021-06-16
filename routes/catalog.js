const express = require('express');
const router = express.Router();

const db = require("./util/db");

/**
 * Retrieves a logged in user's catalog
 */
router.get("/", async (req, res) => {
    // Make sure a user is logged in
    if (!req.session.user) return res.json({ success: false, message: "ERR: No user logged in." });

    // Retrieve a user's catalog
    const [data, error] = await db.catalog.getByUserID(req.session.user.userID);
    if (error) return res.json({ success: false, message: "ERR: Could not retrieve a catalog.", });

    // Return a user's catalog
    return res.json({ success, catalog: data, message: "Catalog successfully retrieved." });
});

/**
 * Add a movie to a logged in user's catalog
 */
router.post("/add", async (req, res) => {
    // Make sure a user is logged in
    if (!req.session.user) return res.json({ success: false, message: "A user must be logged in to add to their catalog." });

    // Make sure all parameters are present
    if (!req.body.imdbID && !req.body.tmdbID && !req.body.title && !req.body.poster && !req.body.releaseDate) {
        return res.json({ success: false, message: "ERR: Missing parameter(s): imdbID, tmdbID, title, poster, and/or releaseDate." });
    }
    
    // Check the table "MOVIES" in the database for a movie with a matching TMDb ID.
    // If found, note its "MOVIE_ID". If a movie is not found then add the given movie's 
    // information to the "MOVIES" table and note its insert ID.
    let movieID;

    const [data_1, error_1] = await db.movies.find.byTMDbID(req.body.tmdbID);

    if (error_1) return res.json({ success: false, message: "ERR: Checking movies for match" });

    if (data_1.length === 0) {
        const [data_2, error_2] = await db.movies.insert(req.body);
        if (error_2) return res.json({ success: false, message: "ERR: Adding movie to database." });
        movieID = data_2.insertId;
    } else {
        movieID = data_1[0].MOVIE_ID;
    }
    
    // Check the "WISH_LIST" table for a movie with a matching movie ID. If one is found then remove it.
    const [data_3, error_3] = await db.wishList.checkFor(req.session.user.userID, movieID);
    if (error_3) return res.json({ success: false, message: "ERR: Checking wish list for match." });

    if (data_3.length !== 0) { 
        const [, error_4] = await db.wishList.remMovie(req.session.user.userID, movieID);
        if (error_4) return res.json({ success: false, message: "ERR: Deleting from wish list." });
    }

    // Then check the "CATALOG" table for a matching entry given a movie ID and the logged in user's user ID.
    const [data_5, error_5] = await db.catalog.checkFor(req.session.user.userID, movieID);
    if (error_5) return res.json({ success: false, message: "ERR: Checking catalog for match" });

    if (data_5.length !== 0) return res.json({ success: false, message: "ERR: Movie has already been cataloged for user." });

    // If not matching entry is found then add the user ID and movie ID to the "CATALOG" table.
    const [, error_6] = await db.catalog.addMovie(req.session.user.userID, movieID);
    if (error_6) return res.json({ success: false, message: "ERR: Adding movie to catalog" });

    return res.json({ success: true, message: "Movie cataloged for User." });
});

/**
 * Remove a movie from a logged in user's catalog
 */
router.delete("/remove", async (req, res) => {
    // Make sure a user is logged in
    if (!req.session.user) return res.json({ success: false, message: "ERR: No user logged in." });

    // Make sure all parameters are present
    if (!req.body.tmdbID) return res.json({ success: false, message: "ERR: Missing parameter: tmdbID" });

    // Check the table "MOVIES" in the database for a movie with a matching TMDb ID.
    // If found, remove it from the user's catalog. If a movie is not found then return an error.
    const [data_1, error_1] = await db.movies.find.byTMDbID(req.body.tmdbID);

    if (error_1) return res.json({ success: false, message: "ERR: Checking movies for match" });

    if (data_1.length === 0) return res.json({ success: false, message: "ERR: No match for movie found." });
        
    const movieID = data_1[0].MOVIE_ID;
    
    const [, error_2] = await db.catalog.remMovie(req.session.user.userID, movieID);
    if (error_2) return res.json({ success: false, message: "ERR: Removing movie from catalog." });
    return res.json({ success: true, message: "Movie removed from user's catalog." });
});


// Update copy count


module.exports = router;