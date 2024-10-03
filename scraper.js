const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeWhoScored() {
  try {
    // Launch the browser
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    // Set a user agent to bypass scraping measures
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the page
    await page.goto('https://www.whoscored.com/', { waitUntil: 'networkidle0' });

    // Wait for the content to load
    await page.waitForSelector('[class*="Match-module_match"]', { timeout: 10000 });

    // Extract match information
    const matchInfo = await page.evaluate(() => {
      const matches = Array.from(document.querySelectorAll('[class*="Match-module_match"]'));
      return matches.map(match => {
        const startTime = match.querySelector('[class*="Match-module_startTime"]')?.textContent.trim() || '';
        const teams = Array.from(match.querySelectorAll('[class*="Match-module_teamNameText"]')).map(team => team.textContent.trim());
        const odds = Array.from(match.querySelectorAll('[class*="Match-module_oddsButton"] [class*="OddsButton-module_oddsText"]')).map(odd => odd.textContent.trim());
        const leagueElement = match.closest('.Accordion-module_accordion__UuHD0');
        const league = leagueElement ? leagueElement.querySelector('.Tournaments-module_title__tSP3d a')?.textContent.trim() : '';
        if(odds.length === 0){
          return null;
        }
        return {
          league,
          startTime,
          homeTeam: teams[0] || '',
          awayTeam: teams[1] || '',
          odds: {
            home: odds[0] || '',
            draw: odds[1] || '',
            away: odds[2] || ''
          }
        };
      }).filter(match => match !== null);
    });

    // Close the browser
    await browser.close();

    // Save the result as JSON
    fs.writeFileSync('result.json', JSON.stringify(matchInfo, null, 2));

    return matchInfo;

  } catch (error) {
    console.error('Error scraping WhoScored:', error);
    return null;
  }
}

// Usage
scrapeWhoScored().then(() => console.log('Data saved to result.json'));