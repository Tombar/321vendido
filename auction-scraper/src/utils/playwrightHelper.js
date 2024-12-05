const { chromium } = require('playwright');

class PlaywrightHelper {
  constructor() {
    this.browser = null;
    this.defaultOptions = { headless: true, devtools: false, slowMo: 0 };
  }

  async initBrowser(customOptions = {}) {
    if (!this.browser) {
      const options = { ...this.defaultOptions, ...customOptions };

      //const options = { headless: false, devtools: true, args: ['--start-maximized'] }

      this.browser = await chromium.launch(options);
    }
    return this.browser;
  }

  async newPage(customOptions = {}) {
    // Ensure the browser is initialized with the given options
    if (!this.browser) {
      await this.initBrowser(customOptions);
    }

    const context = await this.browser.newContext();
    return await context.newPage();
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PlaywrightHelper;
