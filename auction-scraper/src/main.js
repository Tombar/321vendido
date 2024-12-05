const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const PlaywrightHelper = require('./utils/playwrightHelper');
const { db } = require('./db/database'); // Ensure the database is initialized
const scrapeRemotesComUy = require('./scrapers/scraperRemotesComUY');
const scrapeCastells = require('./scrapers/scraperCastells');

const scrapers = {
  remotes: scrapeRemotesComUy,
  castells: scrapeCastells,
};

const runScrapers = async (scraperNames, debugMode) => {
  const helper = new PlaywrightHelper();

  try {
    console.log('Initializing Playwright...');
    console.log('Playwright options:', { headless: !debugMode, devtools: debugMode});
    await helper.initBrowser({ headless: !debugMode, devtools: debugMode, args: ['--start-maximized'] });

    const selectedScrapers = scraperNames.map((name) => {
      if (!scrapers[name]) {
        throw new Error(`Scraper for "${name}" not found.`);
      }
      return scrapers[name](helper); 
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
        .option('debug', {
          alias: 'd',
          type: 'boolean',
          description: 'Enable Playwright debug mode',
          default: false,
        })
        .help()
        .alias('help', 'h');
    })
    .argv;

  const scraperNames = argv.sites;
  const debugMode = argv.debug; 

  try {
    await runScrapers(scraperNames, debugMode);
  } catch (error) {
    console.error('Error initializing scrapers:', error);
  }
})();
