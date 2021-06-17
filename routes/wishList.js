const express = require('express');
const router = express.Router();

const db = require("./util/db");

/**
 * Retrieves a logged in user's wish list
 */
router.get("/", async (req, res) => {
    // Make sure a user is logged in
    if (!req.session.user) return res.json({ success: false, message: "ERR: No user logged in." });

    // Retrieve a user's wish list
    const [data, error] = await db.wishList.getByUserID(req.session.user.userID);
    if (error) return res.json({ success: false, message: "ERR: Could not retrieve a wish list.", });

    // Return a user's wish list
    return res.json({ success, catalog: data, message: "Wish list successfully retrieved." });
});

/**
 * Add a movie to a logged in user's wish list
 */
router.post("/add", async (req, res) => {
    // Make sure a user is logged in
    if (!req.session.user) return res.json({ success: false, message: "A user must be logged in to add to their wish list." });

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
    
    // Check the "CATALOG" table for a movie with a matching movie ID. 
    // If one is found then return an error, you can't wish for something you have.
    const [data_3, error_3] = await db.catalog.checkFor(req.session.user.userID, movieID);
    if (error_3) return res.json({ success: false, message: "ERR: Checking catalog for match." });
    if (data_3.length !== 0) return res.json({ success: false, message: "ERR: Movie is in user's catalog." });

    // Then check the "WISH_LIST" table for a matching entry given a movie ID and the logged in user's user ID.
    const [data_5, error_5] = await db.wishList.checkFor(req.session.user.userID, movieID);
    if (error_5) return res.json({ success: false, message: "ERR: Checking wish list for match" });
    if (data_5.length !== 0) return res.json({ success: false, message: "ERR: Movie has already been wished for user." });

    // If not matching entry is found then add the user ID and movie ID to the "WISH_LIST" table.
    const [, error_6] = await db.wishList.addMovie(req.session.user.userID, movieID);
    if (error_6) return res.json({ success: false, message: "ERR: Adding movie to wish list" });

    return res.json({ success: true, message: "Movie wished for User." });
});

/**
 * Remove a movie from a logged in user's wish list
 */
router.delete("/remove", async (req, res) => {
    // Make sure a user is logged in
    if (!req.session.user) return res.json({ success: false, message: "ERR: No user logged in." });

    // Make sure all parameters are present
    if (!req.body.tmdbID) return res.json({ success: false, message: "ERR: Missing parameter: tmdbID" });

    // Check the table "MOVIES" in the database for a movie with a matching TMDb ID.
    // If found, remove it from the user's wish list. If a movie is not found then return an error.
    const [data_1, error_1] = await db.movies.find.byTMDbID(req.body.tmdbID);

    if (error_1) return res.json({ success: false, message: "ERR: Checking movies for match" });

    if (data_1.length === 0) return res.json({ success: false, message: "ERR: No match for movie found." });
        
    const movieID = data_1[0].MOVIE_ID;

    // Check if movie is in user's wish list
    const [data_2, error_2] = await db.wishList.checkFor(req.session.user.userID, movieID);
    if (error_2) return res.json({ success: false, message: "ERR: Checking wish list for match" });
    if (data_2.length === 0) return res.json({ success: false, message: "ERR: Movie is not in user's wish list." });
    
    // If not, add to wish list
    const [, error_3] = await db.wishList.remMovie(req.session.user.userID, movieID);
    if (error_3) return res.json({ success: false, message: "ERR: Removing movie from wish list." });
    return res.json({ success: true, message: "Movie removed from user's wish list." });
});

module.exports = router;