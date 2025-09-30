import { createBaseCrawler } from '@shared/baseCrawler';
import { Dataset, PlaywrightCrawlingContext, createPlaywrightRouter } from 'crawlee';

async function main() {
    const router = createPlaywrightRouter<PlaywrightCrawlingContext>();

    //Handle product detail pages 
    router.addHandler("DETAIL", async ({ page, request, log }: PlaywrightCrawlingContext) => {
        log.info(`Scraping detail: ${request.url}`);
        const sku = await page.locator('span.sku').textContent();
        const title = await page.locator('h1.product_title').textContent();
        const category = await page.locator('.posted_in a').textContent();

        const priceText = await page.locator('p.price span.product-price bdi').textContent();
        const price = Number(priceText?.replace(/[^0-9.]/g, ''));

        const images = await page.locator('.woocommerce-product-gallery__wrapper a').evaluateAll(imgs => imgs.map(img => img.getAttribute('href')).filter(Boolean));
        const sizes = await page.locator('#size option').evaluateAll(options => options.map(o => o.getAttribute('value')).filter(v => v && v !== ''));
        const colors = await page.locator('#color option').evaluateAll(options => options.map(o => o.getAttribute('value')).filter(v => v && v !== ''));

        const descriptionHtml = await page.locator('#tab-description').innerHTML();
        const description = descriptionHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();

        await Dataset.pushData({ url: request.url, sku, title, category, price, images, sizes, colors, description });

        // await Dataset.exportToJSON('contoh')

    });

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
        maxRequests: 100,
    });

    await run("ECOMMERCE")
}

main();
