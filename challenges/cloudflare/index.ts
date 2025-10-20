import { PlaywrightCrawlingContext, createPlaywrightRouter, log } from 'crawlee';
import { launchOptions } from 'camoufox';
import { firefox } from 'playwright';
import { createBaseCrawler } from '@shared/baseCrawler';

const START_URLS = [
    'https://www.scrapingcourse.com/cloudflare-challenge',
    'https://www.scrapingcourse.com/antibot-challenge',
];
const START_LABEL = 'CLOUDFLARE_CHALLENGE';

const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

router.addHandler(START_LABEL, async ({ request, page, session }: PlaywrightCrawlingContext) => {
    log.info(`Processing: ${request.url}`);

    const title = await page.title();
    log.info(`Page title: ${title}`);

    const successHeader = page.locator('h2:has-text("You bypassed")');

    if (await successHeader.isVisible()) {
        log.info('✅ Challenge bypassed successfully!');
    } else {
        log.warning(`❌ Failed to bypass the challenge for ${request.url}.`);
        session?.retire();
        throw new Error('Failed to bypass Cloudflare');
    }
});

router.addDefaultHandler(async ({ request }) => {
    log.warning(`No route found for ${request.url}`);
});

const { run } = createBaseCrawler({
    startUrls: START_URLS,
    useSessionPool: true,
    persistCookiesPerSession: true,
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
    async requestHandler(context) {
        return router(context);
    },
});

log.info(`🚀 Starting crawler for: ${START_URLS.join(', ')}`);
await run(START_LABEL);
log.info('✅ Crawler finished.');