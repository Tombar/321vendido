const { chromium } = require('playwright');
const { playwrightOptions } = require('../config');

class PlaywrightHelper {
  constructor(options = playwrightOptions) {
    this.browser = null;
    this.options = options;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch(this.options);
    }
    return this.browser;
  }

  async newPage() {
    if (!this.browser) {
      await this.initBrowser();
    }
    return await this.browser.newPage();
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PlaywrightHelper;
