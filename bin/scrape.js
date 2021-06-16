/*
    This script is meant to be executed at a reoccuring time.
    Since the application is hosted on Heroku, the Heroku 
    Schedular add-on will be used. There, this cron job will 
    be defined and executed at a decided interval.
*/

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const db = require("../routes/util/db");

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

/**
 * Retrieves movie info. from the TMDb API 
 * @param imdbID
 * @returns results of calling the TMDb API
 */
const fetchMovieInfo = async ({ imdbID }) => {
    const url = `https://api.themoviedb.org/3/find/${imdbID}?api_key=${process.env.TMDB_API_KEY}&language=en-US&external_source=imdb_id`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

/**
 * Performs a web scrape to retrieve new DVD release info. by week 
 * @returns results of a web scrape
 */
const scrape = async () => {
    /* Initiate the Puppeteer browser */
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    /* Go to the source web page and wait for it to load */
    const url = "https://www.dvdsreleasedates.com/";
    await page.goto(url, { waitUntil: 'networkidle0' });

    /* Run javascript inside of the page */
    let data = await page.evaluate(() => {
        let releases = [];

        const rows = Array.from(document.querySelectorAll("table[class='fieldtable-inner']"));
        rows.forEach((row) => {
            let releaseWeek = row.querySelector('.reldate').innerText.replace('\n', ' ');

            let columns = Array.from(row.querySelectorAll("td[class='dvdcell']"));
            columns.forEach((column) => {
                let imageElement = column.querySelector("img[class='movieimg']");
                let title = imageElement.getAttribute("title").replace(" DVD Release Date", '');
                let poster = imageElement.getAttribute("src");
                let imdbID = column.querySelector("td[class='imdblink left'] > a").href.split('/')[4];

                releases.push({ title, poster, imdbID, releaseWeek });
            });
        });

        /* Returning an array of objects filled with the scraped data */
        return releases;
    });

    /* Close the Puppeteer browser */
    await browser.close();

    /* Return what was scraped */
    return data;
};

// Main function to be executed via a cron job
(async () => {
    // Perform a web scrape for new dvd release information by week
    let scrapeResults = {};

    try {
        scrapeResults = await scrape();
        console.log(JSON.stringify(scrapeResults, null, 2));
    } catch (error) {
        console.log(error);
        return;
    }

    // If the scrape was successful and there are new releases
    // clear the 'NEW_RELEASES' table and insert the new data concurrently
    if (Object.keys(scrapeResults).length === 0) {
        console.log("No new release info. was scraped!");
        return;
    }
    console.log(`${scrapeResults.length} results have been scraped.`);

    const { success } = await db.newReleases.clearAll();
    if (!success) {
        console.log("Could not empty 'NEW_RELEASES' table!");
        return;
    }
    console.log("Table: 'NEW_RELEASES', has been emptied of all data.");

    // Gather info. on each scraped release from the TMDb API, 
    // then insert it into the 'NEW_RELEASES' table in the database
    let insertionResults = await Promise.all(scrapeResults.map(async (result) => {
        // Get info. on the result from the TMDb API
        const [data, error] = await asyncHandler(async () => { return await fetchMovieInfo(result) });
        if (error) {
            console.error(error);
            return false;
        }
    
        const { movie_results: fetchResults = [] } = data;
    
        // Check for any results
        if (fetchResults.length == 0) {
            console.log(`No movie results found for result with an IMDb ID of ${result.imdbID}.`);
            return false;
        }
    
        // Insert release info. into the db
        const release = {
            imdbID: result.imdbID, 
            tmdbID: fetchResults[0].id, 
            title: fetchResults[0].title, 
            poster: `https://image.tmdb.org/t/p/w342${fetchResults[0].poster_path}`, 
            releaseWeek: result.releaseWeek
        };
    
        const { success, error: err = false } = await db.newReleases.insert(release);
    
        if (!success && !err) {
            console.log("Could not insert release into table: 'NEW_RELEASES'.");
            console.error(error);
            return false;
        }
    
        console.log("Scraped release successfully inserted into table: 'NEW_RELEASES'.");
        return true;
    }));

    console.log(insertionResults);
})().then(() => process.exit(0));
