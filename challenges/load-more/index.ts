import { createBaseCrawler } from '@shared/baseCrawler';
import { detailHandler } from '@shared/detailProductHandler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    //Handle product detail pages 
    router.addHandler("DETAIL", detailHandler);

    router.addHandler("LOAD_MORE", async ({ page, request, enqueueLinks, log }: PlaywrightCrawlingContext) => {
        log.info(`Scraping with load more: ${request.url}`);
        const productSelector = '#product-grid .product-item';
        await page.waitForSelector(productSelector);

        const enqueueProductDetails = async () => {
            const { processedRequests } = await enqueueLinks({
                selector: '.product-item a',
                label: "DETAIL",
                strategy: 'all',
                globs: [
                    'https://scrapingcourse.com/ecommerce/product/**',
                    'https://www.scrapingcourse.com/ecommerce/product/**',
                ],
            });

            if (processedRequests.length) {
                log.info(`Queued ${processedRequests.length} product detail requests`);
            }
        };

        await enqueueProductDetails();

        const loadMoreButton = page.locator('#load-more-btn');
        let previousCount = await page.locator(productSelector).count();

        while (await loadMoreButton.isVisible() && await loadMoreButton.isEnabled()) {
            log.info('Clicking load more button');
            await loadMoreButton.click();

            try {
                await page.waitForFunction(
                    ({ selector, prevCount }) => document.querySelectorAll(selector).length > prevCount,
                    { selector: productSelector, prevCount: previousCount },
                    { timeout: 10000 }
                );
            } catch {
                log.info('No new products detected after click');
                break;
            }

            const currentCount = await page.locator(productSelector).count();
            const newItems = currentCount - previousCount;

            if (newItems > 0) {
                log.info(`Detected ${newItems} new products; total ${currentCount}`);
            }

            previousCount = currentCount;
            await enqueueProductDetails();
        }
    });

    // Default handler for unmatched routes
    router.addDefaultHandler(async ({ request, log }) => { log.warning(`No route found for ${request.url}`); });

    const { run } = createBaseCrawler({
        requestHandler: router,
        startUrls: ['https://www.scrapingcourse.com/button-click'],
        maxRequests: 500,
    });

    await run('LOAD_MORE');

    await Dataset.exportToCSV("load-more_results")

}

main()