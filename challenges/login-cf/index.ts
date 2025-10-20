import { launchOptions } from 'camoufox';
import { firefox } from 'playwright';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter, log } from 'crawlee';
import { detailHandler } from '@shared/detailProductHandler';
import { createBaseCrawler } from '@shared/baseCrawler';

const USER_EMAIL = 'admin@example.com';
const USER_PASSWORD = 'password';

const START_URLS = ['https://www.scrapingcourse.com/login/cf-antibot'];
const START_LABEL = 'LOGIN_CF';

const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

router.addHandler('DETAIL', detailHandler);

router.addHandler(START_LABEL, async ({ page, request, enqueueLinks, session, log }: PlaywrightCrawlingContext) => {
    log.info(`Processing login CF flow: ${request.url}`);

    const successHeader = page.locator('h2:has-text("Challenge")');

    if (!(await successHeader.isVisible())) {
        log.warning(`❌ Did not land on the expected login challenge page for ${request.url}.`);
        session?.retire();
        throw new Error('Failed to reach login challenge page');
    }

    await page.waitForSelector('#email', { timeout: 10000 });
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('#submit-button');

    await page.waitForURL('https://www.scrapingcourse.com/dashboard', { timeout: 15000 });

    log.info('Login successful, queueing protected products.');

    const { processedRequests } = await enqueueLinks({
        selector: '.product-item a',
        label: 'DETAIL',
        strategy: 'all',
        globs: [
            'https://scrapingcourse.com/ecommerce/product/**',
            'https://www.scrapingcourse.com/ecommerce/product/**',
        ],
    });

    if (!processedRequests.length) {
        log.warning('No protected product links found after login.');
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
            // headless: false,
            locale: 'en-US',
            timezoneId: 'America/New_York',
        }),
    },
    async requestHandler(context) {
        return router(context);
    },
});

await run(START_LABEL);

await Dataset.exportToCSV('login-cf-results');
