var express = require('express');
var router = express.Router();

const { tmdb_title_search, tmdb_id_advanced_search } = require("./util/tmdb");

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

module.exports = router;