const mysql = require("mysql");

// Create and configure a pool to handle query requests to the database
const pool = mysql.createPool({
    user: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST || "",
    port: process.env.DB_PORT || "",
    database: process.env.DB_NAME || ""
});

/**
 * Conducts a query to the DB, handling all CRUD operations
 * @param query
 * @param values
 * @returns Promise that pulls or edits info from the db
 */
 const query = async (query, values = []) => {
    return new Promise((resolve, reject) => {
        pool.query(query, values, (error, results) => {
            if (error) {
                return reject(error);
            } 
            
            return resolve(results);
        });
    });
};

/**
 * Executes an async function and helps with error handling 
 * @param asyncFunc
 * @returns results or errors of executing the given async function
 */
const asyncHandler = async (asyncFunc) => {
    try {
        const data = await asyncFunc();
        return [data, null]; 
    } catch (error) {
        return [null, error];
    }
};

let db = {};

db.query = async (queryString, valuesArray = []) => {
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
}

db.newReleases = {};

db.newReleases.all = async () => {
    const [data, error] = await asyncHandler(async () => { return await query("SELECT * FROM NEW_RELEASES") });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.newReleases.insert = async ({ imdbID, tmdbID, title, poster, releaseWeek }) => {
    const queryString = 'INSERT INTO NEW_RELEASES VALUES(NULL, ?, ?, ?, ?, ?);';
    const valuesArray = [imdbID, tmdbID, title, poster, releaseWeek];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.newReleases.clearAll = async () => {
    "TRUNCATE TABLE NEW_RELEASES;"
    const [data, error] = await asyncHandler(async () => { return await query("TRUNCATE TABLE NEW_RELEASES;") });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.movies = {};

db.movies.all = async () => {
    const [data, error] = await asyncHandler(async () => { return await query("SELECT * FROM MOVIES") });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.movies.find = {};

db.movies.find.byMovieID = async (movieID) => {
    const queryString = "SELECT * FROM MOVIES WHERE MOVIE_ID = ?;";
    const valuesArray = [movieID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.movies.find.byIMDbID = async (imdbID) => {
    const queryString = "SELECT * FROM MOVIES WHERE IMDB_ID = ?;";
    const valuesArray = [imdbID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.movies.find.byTMDbID = async (tmdbID) => {
    const queryString = "SELECT * FROM MOVIES WHERE TMDB_ID = ?;";
    const valuesArray = [tmdbID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.movies.insert = async ({ imdbID, tmdbID, title, poster, releaseDate }) => {
    const queryString = 'INSERT INTO MOVIE VALUES(NULL, ?, ?, ?, ?, ?);';
    const valuesArray = [imdbID, tmdbID, title, poster, releaseDate];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users = {};

db.users.all = async () => { 
    const [data, error] = await asyncHandler(async () => { return await query("SELECT * FROM USERS") });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.insert = async ({ username, password, firstName, lastName, emailAddress }) => {
    const queryString = 'INSERT INTO USERS VALUES(NULL, ?, ?, ?, ?, ?, CURDATE());';
    const valuesArray = [username, password, firstName, lastName, emailAddress];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.find = {};

db.users.find.byUsername = async (username) => {
    const queryString = 'SELECT * FROM USERS WHERE USERNAME = ?;';
    const valuesArray = [username];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.update = {};

db.users.update.username = async (userID, username) => {
    const queryString = 'UPDATE USERS SET USERNAME = ? WHERE USER_ID = ?;';
    const valuesArray = [username, userID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.update.password = async (userID, password) => {
    const queryString = 'UPDATE USERS SET PASSWORD = ? WHERE USER_ID = ?;';
    const valuesArray = [password, userID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.update.firstName = async (userID, firstName) => {
    const queryString = 'UPDATE USERS SET FIRST_NAME = ? WHERE USER_ID = ?;';
    const valuesArray = [firstName, userID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.update.lastName = async (userID, lastName) => {
    const queryString = 'UPDATE USERS SET LAST_NAME = ? WHERE USER_ID = ?;';
    const valuesArray = [lastName, userID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.update.emailAddress = async (userID, emailAddress) => {
    const queryString = 'UPDATE USERS SET EMAIL_ADDRESS = ? WHERE USER_ID = ?;';
    const valuesArray = [emailAddress, userID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.remove = async (userID) => {
    const queryString = "DELETE FROM USERS WHERE USER_ID = ?;";
    const valuesArray = [userID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.users.validate = {
    username: ({ username }) => { return username.length >= 6 && username.length <=32 && !username.includes(" ") },
    password: ({ password }) =>  {
      const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?=.*[-!$%^&*()_+|~=`{}\[\]:\/;<>?,.@#]).{8,32}$/;
      return password.length && regex.test(password);
    },
    emailAddress: ({ emailAddress }) => { return emailAddress.length && emailAddress.includes("@"); },
    firstName: ({ firstName }) => { return firstName.length > 0 && firstName.length <= 255; },
    lastName: ({ lastName }) => { return lastName.length > 0 && lastName.length <= 255; }
};

db.catalog = {};

db.catalog.getByUserID = async (userID) => {
    const queryString = "SELECT * FROM CATALOG NATURAL JOIN MOVIES WHERE CATALOG.USER_ID = ?;";
    const [data, error] = await asyncHandler(async () => { return await query(queryString, [userID]) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.catalog.addMovie = async ({ userID, movieID, copies = 1 }) => {
    const queryString = 'INSERT INTO CATALOG VALUES(?, ?, ?);';
    const valuesArray = [userID, movieID, copies];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.catalog.remMovie = async (userID, movieID) => {
    const queryString = "DELETE FROM CATALOG WHERE USER_ID = ? AND MOVIE_ID = ?;";
    const valuesArray = [userID, movieID];
    const [data, error] = await asyncHandler(async () => { return await query(queryString, valuesArray) });
    if (error) return { success: false, error: error };
    return { success: true, data: data };
};

db.wishList = {};

module.exports = db;
