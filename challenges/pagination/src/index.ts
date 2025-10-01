import { detailHandler } from '@shared/detailProductHandler';
import { PlaywrightCrawler, Dataset, RequestQueue, PlaywrightCrawlingContext } from 'crawlee';

async function main() {
    const requestQueue = await RequestQueue.open();

    await requestQueue.addRequest({
        url: 'https://www.scrapingcourse.com/pagination',
        label: 'PAGINATION'
    });

    const crawler = new PlaywrightCrawler({
        requestQueue,
        requestHandler: async ({ page, request, enqueueLinks, log }) => {

            if (request.label === 'PAGINATION') {
                log.info(`Scraping pagination page: ${request.url}`);

                await page.waitForSelector('a.next-page', { state: 'visible' }).catch(() => {
                    log.info('No next-page link found, might be the last page');
                });

                await enqueueLinks({
                    selector: 'a.next-page',
                    label: 'PAGINATION',
                    strategy: 'all'
                });

                await enqueueLinks({
                    selector: '.product-item a',
                    label: 'DETAIL_PAGE',
                    strategy: 'all'
                });
            } else if (request.label === 'DETAIL_PAGE') {
                log.info(`Scraping detail page: ${request.url}`);

                await page.waitForSelector('h1.product_title', { state: 'visible' }).catch(() => {
                    log.warning(`No product title found on ${request.url}`);
                    return;
                });

                detailHandler({ page, request, log } as PlaywrightCrawlingContext);
            }
        },
    });

    await crawler.run();

    console.log('Crawler finished. Exporting data...');
    await Dataset.exportToCSV('pagination-results');
    console.log('Data exported to pagination-results.csv');
}

main();