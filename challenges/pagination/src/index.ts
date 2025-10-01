import { PlaywrightCrawler, Dataset, RequestQueue } from 'crawlee';

async function main() {
    const requestQueue = await RequestQueue.open();

    await requestQueue.addRequest({
        url: 'https://www.scrapingcourse.com/pagination',
        label: 'PAGINATION'
    });

    const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 50,
        requestQueue,
        requestHandler: async ({ page, request: { url, label }, enqueueLinks, log }) => {

            if (label === 'PAGINATION') {
                log.info(`Scraping pagination page: ${url}`);

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
            } else if (label === 'DETAIL_PAGE') {
                log.info(`Scraping detail page: ${url}`);

                // Wait for content to load
                await page.waitForSelector('h1.product_title', { state: 'visible' }).catch(() => {
                    log.warning(`No product title found on ${url}`);
                    return;
                });

                const sku = await page.locator('span.sku').textContent();
                const title = await page.locator('h1.product_title').textContent();
                const category = await page.locator('.posted_in a').textContent();

                const priceText = await page.locator('p.price span.product-price bdi').textContent();
                const price = Number(priceText?.replace(/[^0-9.]/g, ''));

                const images = await page.locator('.woocommerce-product-gallery__wrapper a').evaluateAll(imgs =>
                    imgs.map(img => img.getAttribute('href')).filter(Boolean)
                );

                const sizes = await page.locator('#size option').evaluateAll(options =>
                    options.map(o => o.getAttribute('value')).filter(v => v && v !== '')
                );

                const colors = await page.locator('#color option').evaluateAll(options =>
                    options.map(o => o.getAttribute('value')).filter(v => v && v !== '')
                );

                const paragraphs = await page.locator('#tab-description p').evaluateAll(
                    nodes => nodes.map(n => n.textContent?.trim()).filter(Boolean)
                );
                const description = paragraphs.join('\n\n');

                await Dataset.pushData({
                    url,
                    sku,
                    title,
                    category,
                    price,
                    images,
                    sizes,
                    colors,
                    description
                });
            }
        },
    });

    await crawler.run();

    console.log('Crawler finished. Exporting data...');
    await Dataset.exportToCSV('pagination-results');
    console.log('Data exported to pagination-results.csv');
}

main();