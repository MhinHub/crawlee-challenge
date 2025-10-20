import { createBaseCrawler } from '@shared/baseCrawler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    router.addHandler('TABLE', async ({ page, request, log }: PlaywrightCrawlingContext) => {
        log.info(`Scraping table parsing challenge: ${request.url}`);

        const TABLE_SELECTOR = '#product-catalog tbody tr.product-item';

        await page.waitForSelector(TABLE_SELECTOR, { timeout: 15000 });

        const products = await page.$$eval(TABLE_SELECTOR, rows => {
            return rows.map(row => {
                const getText = (selector: string) => row.querySelector(selector)?.textContent?.trim() ?? null;
                const getAttr = (selector: string, attr: string) => row.querySelector(selector)?.getAttribute(attr) ?? null;

                const priceText = getText('.product-price');
                const priceAttr = getAttr('.product-price', 'content');
                const stockAttr = getAttr('.product-stock', 'data-in-stock');

                return {
                    id: getText('.product-id'),
                    idAttr: getAttr('.product-id', 'data-product-id'),
                    name: getText('.product-name'),
                    category: getText('.product-category'),
                    price: priceAttr ? Number(priceAttr) : priceText ? Number(priceText.replace(/[^0-9.]/g, '')) : null,
                    priceText,
                    inStock: stockAttr ? stockAttr === 'true' : getText('.product-stock')?.toLowerCase() === 'yes',
                };
            });
        });

        log.info(`Extracted ${products.length} products from table.`);

        await Dataset.pushData(products);
    });

    router.addDefaultHandler(async ({ request, log }) => {
        log.warning(`No route found for ${request.url}`);
    });

    const { run } = createBaseCrawler({
        requestHandler: router,
        startUrls: ['https://www.scrapingcourse.com/table-parsing'],
        maxRequests: 100,
    });

    await run('TABLE');

    await Dataset.exportToCSV('table-parsing-results');
}

main();
