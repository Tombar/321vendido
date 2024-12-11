const { insertRemate, insertItem, insertRematador } = require('../db/database');
const PlaywrightHelper = require('../utils/playwrightHelper');

const scrapeLandingPage = async (helper) => {
  const page = await helper.newPage();

  try {
    console.log('Navigating to landing page...');
    await page.goto('http://remotes.com.uy/');

    const results = await page.evaluate(() => {
      return [...document.querySelectorAll('a.selectRemateLabel')].map((remate) => {
        const title = remate.querySelector('h4')?.innerText.trim() || 'No title';
        //const description = remate.querySelector('p')?.innerText.trim() || 'No description';
        const url = remate.href;
        const imageUrl = remate.querySelector('img')?.getAttribute('data-src') || null;
        const cityLocation = remate.querySelector('.badge-info')?.innerText.trim() || 'No location';

        const auctionHouse = remate.querySelector('div.col-5 p:not(.badge)')?.innerText.trim() || 'No auctionHouse';
        
        // Get the paragraph containing all details
        const detailsParagraph = remate.querySelector('div.col-7 p')?.innerText || '';
        
        // Extract auctioneer
        const auctioneer = detailsParagraph.match(/Remata:\s*([^<\n]+)/)?.[1]?.trim() || 'No auctioneer';
        
        const timestamp = detailsParagraph.match(/Cuándo:\s*([^<\n]+)/)?.[1]?.trim() || null;

        // Extract full address
        const fullAddress = detailsParagraph.match(/Dónde:\s*([^<\n]+)/)?.[1]?.trim() || 'No address';
        
        // Extract contact numbers
        const contact = detailsParagraph.match(/Teléfono:\s*([^<\n]+)/)?.[1]?.trim() || 'No contact';

        return {
          remate: { 
            title, 
            //description, 
            url, 
            imageUrl, 
            cityLocation,
            fullAddress,
            timestamp,
          },
          casa_remates: { name: auctionHouse, type: 'casa_remates', contactInfo: contact },
          rematador: { name: auctioneer, type: 'martillero' }
        };
      });
    });
    
    console.log(`Found ${results.length} remates.`);
    return results;
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
        lote_id: item.lote,
        title: item.titulo,
        description: item.descripcion,
        quantity: item.cantidad,
        price: item.base,
        
        assets: item.foto ? item.foto.map(url => ({ type: 'image', url: `https://static3.remotes.com.uy/img/full/${url}` })) : [],
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
    const results = await scrapeLandingPage(helper);

    for (const result of results) {
      // Insert auction house with contact info
      const casaRematesId = await insertRematador(
        result.casa_remates.name,
        result.casa_remates.type,
        result.remate.contact,  // Store contact info with the auction house
        null  // website
      );

      // Insert auctioneer
      const rematadorId = await insertRematador(
        result.rematador.name,
        result.rematador.type,
        null,  // contact_info
        null   // website
      );

      // Insert remate with basic information
      const remateId = await insertRemate(
        'RemotesSite',
        result.remate.title,
        null, //description
        result.remate.timestamp,  // start_date
        null,                     // end_date
        result.remate.url,
        result.remate.cityLocation,  // just using the city location
        rematadorId,
        casaRematesId
      );

      const { items } = await scrapeRemateDetail(helper, result.remate);
    
      for (const item of items) 
        await insertItem(
          remateId,
          item.lote_id,
          item.title,
          item.description,
          item.assets
        );
    }    
  } catch (error) {
    console.error('Error during site scraping:', error);
  } finally {
    await helper.closeBrowser();
  }
};

module.exports = scrapeSite;
