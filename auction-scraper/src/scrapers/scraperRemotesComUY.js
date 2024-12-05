const { insertRemate, insertItem } = require('../db/database');
const PlaywrightHelper = require('../utils/playwrightHelper');

const scrapeLandingPage = async (helper) => {
  const page = await helper.newPage();

  try {
    console.log('Navigating to landing page...');
    await page.goto('http://remotes.com.uy/');

    const remates = await page.evaluate(() => {
      return [...document.querySelectorAll('a.selectRemateLabel')].map((remate) => {
        const title = remate.querySelector('h4')?.innerText.trim() || 'No title';
        const description = remate.querySelector('p')?.innerText.trim() || 'No description';
        const url = remate.href;
        const imageUrl = remate.querySelector('img')?.getAttribute('data-src') || null;
        const location = remate.querySelector('.badge-info')?.innerText.trim() || 'No location';
    
        // Find the "Remata:" field manually
        const remataText = [...remate.querySelectorAll('p')]
          .map((p) => p.innerText)
          .find((text) => text.includes('Remata:'));
        const auctioneer = remataText
          ? remataText.replace('Remata:', '').split(',')[0].trim()
          : 'Unknown';
    
        return {
          title,
          description,
          url,
          imageUrl,
          location,
          auctioneer,
        };
      });
    });
    
    console.log(`Found ${remates.length} remates.`);
    return remates;
  } catch (error) {
    console.error('Error scraping landing page:', error);
    return [];
  } finally {
    await page.close();
  }
};


const scrapeRemateDetail = async (helper, remate) => {
  const page = await helper.newPage();

  try {
    console.log(`Navigating to remate: ${remate.url}`);
    await page.goto(remate.url);

    // Wait for the page content to load
    await page.waitForSelector('#pujarContainer');

    // Extract items data
    const items = await page.evaluate(() => {
      const getTextAfterLabel = (label) => {
        const strongElements = [...document.querySelectorAll('strong')];
        const element = strongElements.find((el) => el.innerText.includes(label));
        return element ? element.nextSibling?.textContent.trim() : null;
      };

      return {
        title: document.querySelector('h4')?.innerText.trim() || 'No title',
        date: getTextAfterLabel('Cuándo:') || 'No date',
        location: getTextAfterLabel('Dónde:') || 'No location',
        phone: getTextAfterLabel('Teléfono:') || 'No phone',
        commission: getTextAfterLabel('Comisión con impuestos:') || 'No commission',
        auctioneer: getTextAfterLabel('Remata:') || 'No auctioneer',
      };
    });

    console.log(`Extracted details:`, items);
    return items;
  } catch (error) {
    console.error(`Error scraping remate details for ${remate.title}:`, error);
    return {};
  } finally {
    await page.close();
  }
};



const scrapeSite = async () => {
  const helper = new PlaywrightHelper();

  try {
    await helper.initBrowser();

    // Scrape all remates from the landing page
    const remates = await scrapeLandingPage(helper);

    for (const remate of remates) {
      // Insert remate into the database
      const remateId = await insertRemate(
        'RemotesSite', // Replace with actual site name
        remate.title,
        remate.description,
        null, // Start date if available
        null, // End date if available
        remate.url
      );

      // Scrape items for each remate
      const items = await scrapeRemateDetail(helper, remate);

      for (const item of items) {
        await insertItem(remateId, item.name, item.description, item.imageUrl);
      }
    }
  } catch (error) {
    console.error('Error during site scraping:', error);
  } finally {
    await helper.closeBrowser();
  }
};

module.exports = scrapeSite;
