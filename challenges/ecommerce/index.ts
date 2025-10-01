import { createBaseCrawler } from '@shared/baseCrawler';
import { detailHandler } from '@shared/detailProductHandler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    //Handle product detail pages 
    router.addHandler("DETAIL", detailHandler);

    // Handle ecommerce product pages 
    router.addHandler("ECOMMERCE", async ({ page, request, enqueueLinks, log }: PlaywrightCrawlingContext) => {
        log.info(`Scraping ecommerce: ${request.url}`);
        await enqueueLinks({ selector: 'a.button.product_type_variable', label: "DETAIL" });
        const nextButton = page.locator('a.next.page-numbers');
        if (await nextButton.count() > 0) {
            await enqueueLinks({
                selector: 'a.next.page-numbers', label: "ECOMMERCE", transformRequestFunction: req => ({ ...req, uniqueKey: req.url })
            });
        }
    });

    // Default handler for unmatched routes
    router.addDefaultHandler(async ({ request, log }) => { log.warning(`No route found for ${request.url}`); });

    const { run } = createBaseCrawler({
        requestHandler: router,
        startUrls: ['https://www.scrapingcourse.com/ecommerce'],
    });

    await run('ECOMMERCE');

    await Dataset.exportToCSV('pagination-results');
    console.log('Data exported to pagination-results.csv');
}

main();
