import { createBaseCrawler } from '@shared/baseCrawler';
import { detailHandler } from '@shared/detailProductHandler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

const MAX_PRODUCTS = 100;

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    router.addHandler("DETAIL", detailHandler);

    router.addHandler("LIST_SCROLL", async ({ page, request, enqueueLinks, log }: PlaywrightCrawlingContext) => {
        log.info(`Scraping with infinite scroll: ${request.url}`);

        let previousHeight = 0;
        let newHeight = 0;
        const PRODUCT_ITEM_SELECTOR = '.product-item';

        while (true) {
            const currentProductCount = await page.locator(PRODUCT_ITEM_SELECTOR).count();
            log.info(`Current products loaded: ${currentProductCount}`);

            if (currentProductCount >= MAX_PRODUCTS) {
                log.info(`Reached MAX_PRODUCTS limit of ${MAX_PRODUCTS}. Stopping scroll.`);
                break;
            }

            previousHeight = await page.evaluate(() => document.body.scrollHeight);

            log.info(`Scrolling to bottom...`);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);

            newHeight = await page.evaluate(() => document.body.scrollHeight);

            if (newHeight === previousHeight) {
                log.info('No more content to load via infinite scroll. Stopping scroll.');
                break;
            }
        }

        const allProductLinks = await page.$$eval('.product-item a', (elements) =>
            elements.map(el => (el as HTMLAnchorElement).href)
        );

        const linksToQueue = allProductLinks.slice(0, MAX_PRODUCTS);

        const { processedRequests } = await enqueueLinks({
            urls: linksToQueue,
            label: "DETAIL",
            strategy: 'all',
            globs: [
                'https://scrapingcourse.com/ecommerce/product/**',
                'https://www.scrapingcourse.com/ecommerce/product/**',
            ],
        });

        if (processedRequests.length) {
            log.info(`Queued ${processedRequests.length} product detail requests, limited by MAX_PRODUCTS.`);
        }
    });

    router.addDefaultHandler(async ({ request, log }) => { log.warning(`No route found for ${request.url}`); });

    const { run } = createBaseCrawler({
        requestHandler: router,
        startUrls: ['https://www.scrapingcourse.com/infinite-scrolling'],
        maxRequests: 500,
    });

    await run('LIST_SCROLL');

    await Dataset.exportToCSV("infinite_scrolling_products.csv");
}

main()