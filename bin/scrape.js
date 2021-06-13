/*
    This script is meant to be executed at a reoccuring time.
    Since the application is hosted on Heroku, the Heroku 
    Schedular add-on will be used. There, this cron job will 
    be defined and executed at a decided interval.
*/

const puppeteer = require('puppeteer');

const URL = "https://www.dvdsreleasedates.com/";

(async () => {
    /* Initiate the Puppeteer browser */
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    /* Go to the source web page and wait for it to load */
    await page.goto(URL, { waitUntil: 'networkidle0' });

    /* Run javascript inside of the page */
    let data = await page.evaluate(() => {
        let weeks = [];

        const rows = Array.from(document.querySelectorAll("table[class='fieldtable-inner']"));
        rows.forEach((row) => {
            let week = {};

            week.releaseWeek = row.querySelector('.reldate').innerText.replace('\n', ' ');

            week.releases = []

            let columns = Array.from(row.querySelectorAll("td[class='dvdcell']"));
            columns.forEach((column) => {
                let imageElement = column.querySelector("img[class='movieimg']");
                let title = imageElement.getAttribute("title").replace(" DVD Release Date", '');
                let src = imageElement.getAttribute("src");

                let imdbLink = column.querySelector("td[class='imdblink left'] > a").href.split('/')[4];

                week.releases.push({ title, src, imdbLink });
            });

            weeks.push(week);
        });

        /* Returning an object filled with the scraped data */
        return weeks;
    });

    /* Outputting what we scraped */
    console.log(JSON.stringify(data, null, 2));
    await browser.close();
})();