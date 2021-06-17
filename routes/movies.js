const express = require('express');
const router = express.Router();

const { tmdb_title_search, tmdb_id_advanced_search } = require("./util/tmdb");
const db = require("./util/db");

/**
 * Searches for a film(s) given a title OR a TMDb ID through the TMDb API
 */
 router.get('/', async (req, res) => {
    if (!req.query.title && !req.query.id) {
        return res.json({ success: false, films: [], message: "Missing parameter: title OR id" });
    } else if (req.query.title && req.query.id) {
        return res.json({ success: false, films: [], message: "You may search by title OR id" });
    }

    if (req.query.title) {
        const { results: films = [] } = await tmdb_title_search(req.query.title)
        return res.json({ success: true, films: films, message: "Film title query successfully processed" });
    } else if (req.query.id) {
        const film = await tmdb_id_advanced_search(req.query.id);
        return res.json({ success: true, films: film, message: "Film ID query successfully processed" });
    }
});

/**
 * Retrieves all new dvd releases grouped by week
 */
 router.get('/new-releases', async (req, res) => {
    const [data, error] = await db.newReleases.all();
    if (error) return res.json({ success: false, message: "ERR: Could not retrieve new releases." });

    const releases = data.reduce((hash, obj) => ({...hash, [obj.RELEASE_WEEK]:( hash[obj.RELEASE_WEEK] || [] ).concat(obj)}), {});
    return res.json({ success: true, message: "New releases retrieved.", releases });
});

module.exports = router;