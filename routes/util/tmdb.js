const fetch = require("node-fetch");

/**
 * Conducts a get request to the TMDb API for a film given a title
 * @param title String 
 * @returns JSON Object
 */
 const tmdb_title_search = async (title) => {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${title}&page=1&include_adult=false`;
    const response = await fetch(url);
    return await response.json();
};

/**
 * Conducts a get request to the TMDb API for a film given the film's TMDb ID
 * @param id Integer 
 * @returns JSON Object
 */
const tmdb_id_basic_search = async (id) => {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
    const response = await fetch(url);
    return await response.json();
};

/**
 * Conducts a get request to the TMDb API for a film and its related watch providers and videos given the film's TMDb ID
 * @param id Integer 
 * @returns JSON Object
 */
const tmdb_id_advanced_search = async (id) => {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US&append_to_response=watch%2Fproviders,videos`;
    const response = await fetch(url);
    return await response.json();
};

module.exports = { tmdb_title_search, tmdb_id_basic_search, tmdb_id_advanced_search };
