import { PlaywrightCrawler, log } from 'crawlee';
import { launchOptions } from 'camoufox';
import { firefox } from 'playwright';

const crawler = new PlaywrightCrawler({
    postNavigationHooks: [
        async ({ handleCloudflareChallenge }) => {
            await handleCloudflareChallenge();
        },
    ],

    browserPoolOptions: {
        useFingerprints: false,
    },

    launchContext: {
        launcher: firefox,
        launchOptions: await launchOptions({
            headless: false,
            locale: 'en-US',
            timezoneId: 'America/New_York',
        }),
    },

    async requestHandler({ request, page, enqueueLinks }) {
        log.info(`Processing: ${request.url}`);

        const title = await page.title();
        log.info(`Page title: ${title}`);

        const successHeader = page.locator('h2:has-text("You bypassed")');

        if (await successHeader.isVisible()) {
            log.info('✅ Challenge bypassed successfully!');
        } else {
            log.warning('❌ Failed to bypass the challenge.');
        }
    },
});

const targetUrls = ['https://www.scrapingcourse.com/cloudflare-challenge', 'https://www.scrapingcourse.com/antibot-challenge'];

log.info(`🚀 Starting crawler for: ${targetUrls.join(', ')}`);
await crawler.run(targetUrls);
log.info('✅ Crawler finished.');