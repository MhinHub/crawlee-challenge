import { createBaseCrawler } from '@shared/baseCrawler';
import { detailHandler } from '@shared/detailProductHandler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    router.addHandler('DETAIL', detailHandler);

    router.addHandler('JS_RENDERING', async ({ page, request, enqueueLinks, log }: PlaywrightCrawlingContext) => {
        log.info(`Scraping JS rendering challenge: ${request.url}`);

        const PRODUCT_ITEM_SELECTOR = '#product-grid .product-item';

        await page.waitForSelector(PRODUCT_ITEM_SELECTOR, { timeout: 15000 });

        await page.waitForFunction(
            (selector) => {
                const items = Array.from(document.querySelectorAll(selector));
                if (items.length === 0) return false;

                return items.every(item => {
                    const name = item.querySelector('.product-name');
                    const price = item.querySelector('.product-price');
                    return Boolean(name?.textContent?.trim() && price?.textContent?.trim());
                });
            },
            PRODUCT_ITEM_SELECTOR,
            { timeout: 15000 }
        );

        const totalProducts = await page.locator(PRODUCT_ITEM_SELECTOR).count();
        log.info(`Detected ${totalProducts} products rendered via JavaScript.`);

        const { processedRequests } = await enqueueLinks({
            selector: '#product-grid .product-item a.product-link',
            label: 'DETAIL',
            strategy: 'all',
            globs: [
                'https://scrapingcourse.com/ecommerce/product/**',
                'https://www.scrapingcourse.com/ecommerce/product/**',
            ],
        });

        if (processedRequests.length) {
            log.info(`Queued ${processedRequests.length} product detail requests from JS-rendering page.`);
        }
    });

    router.addDefaultHandler(async ({ request, log }) => {
        log.warning(`No route found for ${request.url}`);
    });

    const { run } = createBaseCrawler({
        requestHandler: router,
        startUrls: ['https://www.scrapingcourse.com/javascript-rendering'],
        maxRequests: 500,
    });

    await run('JS_RENDERING');

    await Dataset.exportToCSV('js-rendering-results');
}

main();
