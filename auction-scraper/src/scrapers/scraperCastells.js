const { insertRemate, insertItem } = require('../db/database');
const PlaywrightHelper = require('../utils/playwrightHelper');
const fetch = require('node-fetch');

const scrapeLandingPage = async (helper) => {
  const page = await helper.newPage();

  try {
    console.log('Navigating to landing page...');
    await page.goto('https://subastascastells.com/');

    const remates = await page.evaluate(() => {
      const container = document.querySelector('#SubastasenprogresofsContainerTbl');
      if (!container) return [];

      return [...container.querySelectorAll('div[id^="SubastasenprogresofsContainerRow_"]')]
        .map((div) => {
          // Get the NNNN number from the div ID
          const rowId = div.id.split('_')[1];
          
          // Find the title span using the pattern
          const titleSpan = document.querySelector(`#span_SUBASTASENPROGRESO__REMATENOMBRE_${rowId}`);
          const title = titleSpan?.innerText.trim() || 'No title';
          
          // Get other auction details
          const description = div.querySelector('p')?.innerText.trim() || 'No description';
          const imageUrl = div.querySelector('img')?.src || null;
          const dateText = div.querySelector('.date-info')?.innerText.trim() || 'No date';
          
          // Extract the auction ID from any link that contains "Remate=" parameter
          const auctionLink = div.querySelector('a[href*="Remate="]');
          const url = auctionLink?.href || '';
          const auctionId = url.match(/Remate=(\d+)/)?.[1] || '';
          
          return {
            title,
            description,
            url: `https://subastascastells.com/frontend.sitio.visualremate.aspx?Remate=${auctionId}`,
            imageUrl,
            date: dateText,
            auctionId
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

const fetchRemateItems = async (remateId) => {
  try {
    const apiUrl = `https://subastascastells.com/rest/API/Remate/lotes?Remateid=${remateId}&RemateTipo=1&Lastloteid=0&Limit=9999&Timezoneoffset=-480&ClienteId=0&UserGUID=81cccf51-2228-45d0-9ab9-1bc33eacfb84`;
    
    console.log(`Fetching items for remate ${remateId} from API...`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    // console.log('API Response structure:', JSON.stringify(data, null, 2));

    // Check if data is an object with a property containing the items array
    const items = Array.isArray(data) ? data : 
                 data.Lotes ? data.Lotes :
                 data.items ? data.items :
                 data.data ? data.data : [];

    console.log(`Found ${items.length} items from API.`);

    return items.map(item => ({
      name: item.LoteDescripcion || 'No description',
      description: item.DetalleUrl || '',
      imageUrl: item.LoteImageUrl || null
    }));
  } catch (error) {
    console.error(`Error fetching remate items for ID ${remateId}:`, error);
    return [];
  }
};

const scrapeSite = async () => {
  const helper = new PlaywrightHelper();

  try {
    await helper.initBrowser();
    const remates = await scrapeLandingPage(helper);
    console.log(`Starting to process ${remates.length} remates...`);

    for (const remate of remates) {
      try {
        console.log(`Processing remate: ${remate.title}`);
        
        // Insert remate details into the database
        const remateId = await insertRemate(
          'CastellsSite',
          remate.title,
          remate.description,
          null, // start_date
          null, // end_date
          remate.url
        );

        // Fetch and insert items using the API
        const items = await fetchRemateItems(remate.auctionId);
        
        for (const item of items) {
          await insertItem(
            remateId,
            item.name,
            item.description,
            item.imageUrl
          );
        }
        console.log(`Successfully processed remate: ${remate.title}`);
      } catch (remateError) {
        console.error(`Error processing remate ${remate.title}:`, remateError);
        // Continue with next remate
        continue;
      }
    }    
  } catch (error) {
    console.error('Error during site scraping:', error);
  } finally {
    await helper.closeBrowser();
  }
};

module.exports = scrapeSite; 