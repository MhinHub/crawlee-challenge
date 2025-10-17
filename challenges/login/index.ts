import { createBaseCrawler } from '@shared/baseCrawler';
import { detailHandler } from '@shared/detailProductHandler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

const USER_EMAIL = 'admin@example.com';
const USER_PASSWORD = 'password';

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    router.addHandler("DETAIL", detailHandler);

    router.addHandler("LOGIN", async ({ page, request, enqueueLinks, log }: PlaywrightCrawlingContext) => {
        log.info(`Logging in at: ${request.url}`);

        await page.fill('#email', USER_EMAIL);
        await page.fill('#password', USER_PASSWORD);

        await page.click('#submit-button');

        await page.waitForURL('https://www.scrapingcourse.com/dashboard', { timeout: 10000 });

        log.info('Login successful, navigating to protected products page');

        await enqueueLinks({
            selector: '.product-item a',
            label: 'DETAIL',
            strategy: 'all'
        });
    });

    router.addDefaultHandler(async ({ request, log }) => { log.warning(`No route found for ${request.url}`); });

    const { run } = createBaseCrawler({
        requestHandler: router,
        startUrls: ['https://www.scrapingcourse.com/login'],
        maxRequests: 500,
    });

    await run('LOGIN');

    await Dataset.exportToCSV("login_results");

}

main();
