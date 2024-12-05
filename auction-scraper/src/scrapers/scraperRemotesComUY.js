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
    await page.$('audio#martillo + script');

    // Extract the "items" array from the JavaScript context
    const items = await page.evaluate(() => {
      return typeof window.items !== 'undefined' ? window.items : [];
    });

    console.log(`Found ${items.length} items.`);
    return {
      details: remate,
      items: items.map((item) => ({
        id: item.id,
        title: item.titulo,
        description: item.descripcion,
        quantity: item.cantidad,
        price: item.base,
        imageUrl: item.foto ? `https://static3.remotes.com.uy/${item.foto[0]}` : null,
      }))
    };
  } catch (error) {
    console.error(`Error scraping remate details for ${remate.url}:`, error);
    return { details: remate, items: [] };
  } finally {
    await page.close();
  }
};

const scrapeSite = async () => {
  const helper = new PlaywrightHelper();

  try {
    await helper.initBrowser();
    const remates = await scrapeLandingPage(helper);

    for (const remate of remates) {
      // insert remate details into the database
      const remateId = await insertRemate(
        'RemotesSite',
        remate.title,
        remate.description,
        null, // start_date (not available in current scrape)
        null, // end_date (not available in current scrape)
        remate.url
      );

      const { details, items } = await scrapeRemateDetail(helper, remate);
    
      // Updated to use correct item field names from scrape
      for (const item of items) {
        await insertItem(
          remateId,
          item.title,        // Changed from item.name
          item.description,
          item.imageUrl
        );
      }
    }    
  } catch (error) {
    console.error('Error during site scraping:', error);
  } finally {
    await helper.closeBrowser();
  }
};

module.exports = scrapeSite;
