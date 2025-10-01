import { Dataset, PlaywrightCrawlingContext } from 'crawlee';

export async function detailHandler({ page, request, log }: PlaywrightCrawlingContext) {
    log.info(`Scraping detail: ${request.url}`);

    try {
        await page.waitForSelector('h1.product_title', { state: 'visible' }).catch(() => {
            log.warning(`No product title found on ${request.url}`);
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
            url: request.url,
            sku,
            title,
            category,
            price,
            images,
            sizes,
            colors,
            description
        });
    } catch (error: any) {
        log.error(`Error scraping detail page ${request.url}: ${error.message}`);
    }
}
