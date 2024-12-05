const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const PlaywrightHelper = require('./utils/playwrightHelper');
const { db } = require('./db/database'); // Ensure the database is initialized
const scrapeRemotesComUy = require('./scrapers/scraperRemotesComUY');

const scrapers = {
  remotes: scrapeRemotesComUy,
};

const runScrapers = async (scraperNames) => {
  const helper = new PlaywrightHelper();

  try {
    console.log('Initializing Playwright...');
    await helper.initBrowser();

    const selectedScrapers = scraperNames.map((name) => {
      if (!scrapers[name]) {
        throw new Error(`Scraper for "${name}" not found.`);
      }
      return scrapers[name](helper); // Pass the helper to each scraper
    });

    console.log(`Starting scrapers: ${scraperNames.join(', ')}`);
    await Promise.all(selectedScrapers);
    console.log('Scraping completed!');
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    console.log('Closing resources...');
    await helper.closeBrowser();
    db.close(); // Close the database
    console.log('Resources closed.');
  }
};

(async () => {
  const argv = yargs(hideBin(process.argv))
    .usage('$0 [options]', 'Run auction site scrapers.', (yargs) => {
      yargs
        .option('sites', {
          alias: 's',
          type: 'array',
          description: 'List of scrapers to run (e.g., siteA, siteB)',
          demandOption: true,
        })
        .help()
        .alias('help', 'h');
    })
    .argv;

  const scraperNames = argv.sites;

  try {
    await runScrapers(scraperNames);
  } catch (error) {
    console.error('Error initializing scrapers:', error);
  }
})();
