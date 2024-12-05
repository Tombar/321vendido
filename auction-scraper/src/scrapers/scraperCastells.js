const { insertRemate, insertItem } = require('../db/database');
const PlaywrightHelper = require('../utils/playwrightHelper');

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

const scrapeRemateDetail = async (helper, remate) => {
  const page = await helper.newPage();

  try {
    console.log(`Navigating to remate: ${remate.url}`);
    await page.goto(remate.url);

    // Extract details and items data
    const { details, items } = await page.evaluate(() => {
      // Extract auction details
      const details = {
        title: document.querySelector('#span_DETALLEREMATE_REMATENOMBRE')?.innerText.trim() || 'No title',
        
        // Get the full date range text and split it
        dateText: document.querySelector('#span_DETALLEREMATE_REMATERANGOTEXTO')?.innerText.trim() || '',
        
        // Parse start and end dates from the date text
        // Example format: "Lun 18 de Nov. - Jue 05 de Dic. | Comienzo 20 h"
        get start_date() {
          const match = this.dateText.match(/^([^-]+)-/);
          return match ? match[1].trim() : 'No start date';
        },
        
        get end_date() {
          const match = this.dateText.match(/-([^|]+)\|/);
          return match ? match[1].trim() : 'No end date';
        }
      };

      // Extract items from cards
      const items = [...document.querySelectorAll('.card[data-id]')]
        .map(card => {
          // Combine description and subdescription
          const description = [
            card.querySelector('.card-description')?.innerText.trim(),
            card.querySelector('.card-subdescription')?.innerText.trim()
          ].filter(Boolean).join(' - ');

          return {
            name: card.querySelector('.card-title')?.innerText.trim() || 'No name',
            description: description || 'No description',
            imageUrl: card.querySelector('.card-image img')?.src || null,
          };
        });

      return { details, items };
    });

    console.log(`Extracted details:`, details);
    console.log(`Found ${items.length} items.`);
    return { details, items };
  } catch (error) {
    console.error(`Error scraping remate details for ${remate.title}:`, error);
    return { details: {}, items: [] };
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
      const { details, items } = await scrapeRemateDetail(helper, remate);
    
      // Insert remate details into the database
      const remateId = await insertRemate(
        'CastellsSite',
        details.title,
        details.date,
        details.description,
        remate.url,
        remate.auctionId
      );
    
      // Insert each item associated with this remate
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