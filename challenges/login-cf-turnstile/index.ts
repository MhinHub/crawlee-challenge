import { launchOptions } from 'camoufox';
import { firefox } from 'playwright';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter, log } from 'crawlee';
import { detailHandler } from '@shared/detailProductHandler';
import { createBaseCrawler } from '@shared/baseCrawler';

const USER_EMAIL = 'admin@example.com';
const USER_PASSWORD = 'password';
const START_URLS = ['https://www.scrapingcourse.com/login/cf-turnstile'];
const START_LABEL = 'LOGIN_CF_TURNSTILE';

const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

router.addHandler('DETAIL', detailHandler);

router.addHandler(START_LABEL, async ({ page, request, enqueueLinks, log }: PlaywrightCrawlingContext) => {
    log.info(`[LOGIN] Processing login page: ${request.url}`);

    await page.waitForSelector('#email', { timeout: 10000 });
    log.info('[LOGIN] Filling in email and password...');
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);

    const turnstileFrame = page.locator('div[id="waf"]');

    await turnstileFrame.waitFor({ state: 'attached', timeout: 10000 });
    log.info('[LOGIN] Cloudflare Turnstile widget detected. Awaiting verification...');

    await page.waitForFunction(
        () => {
            const response = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
            return response && response.value;
        },
        {},
        { timeout: 60000 },
    );

    log.info('[LOGIN] Turnstile verification successful! Token received.');

    log.info('[LOGIN] Clicking submit button...');
    await page.click('#submit-button');

    await page.waitForURL('https://www.scrapingcourse.com/dashboard', { timeout: 20000 });
    log.info('[LOGIN] Login successful, redirected to dashboard.');

    log.info('[LOGIN] Enqueueing product links...');
    const { processedRequests } = await enqueueLinks({
        selector: '.product-item a',
        label: 'DETAIL',
        strategy: 'all',
    });

    if (!processedRequests.length) {
        log.warning('[LOGIN] No product links found on the dashboard.');
    } else {
        log.info(`[LOGIN] Successfully enqueued ${processedRequests.length} product links.`);
    }
});

router.addDefaultHandler(async ({ request }) => {
    log.warning(`No matching handler for URL: ${request.url}`);
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
            headless: true,
            locale: 'en-US',
            timezoneId: 'America/New_York',
        }),
    },
    async requestHandler(context) {
        return router(context);
    },
});

await run(START_LABEL);

await Dataset.exportToCSV('login-cf-turnstile-results');
log.info('Scraping process finished.');