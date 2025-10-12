import { Dataset, PlaywrightCrawlingContext } from 'crawlee';

async function getTextContent(page: PlaywrightCrawlingContext['page'], selector: string) {
    const locator = page.locator(selector).first();
    if (await locator.count() === 0) return null;
    return (await locator.textContent())?.trim() ?? null;
}

export async function detailHandler({ page, request, log }: PlaywrightCrawlingContext) {
    log.info(`Scraping detail: ${request.url}`);

    try {
        const titleLocator = page.locator('h1.product_title').first();
        try {
            await titleLocator.waitFor({ state: 'visible', timeout: 15000 });
        } catch {
            log.warning(`No product title found on ${request.url}`);
            return;
        }

        const title = (await titleLocator.textContent())?.trim() ?? null;
        const sku = await getTextContent(page, 'span.sku');
        const category = await getTextContent(page, '.posted_in a');
        const priceText = await getTextContent(page, 'p.price span.product-price bdi');

        if (!title || !priceText) {
            log.warning(`Skipping product without required fields on ${request.url}`);
            return;
        }

        const price = Number(priceText.replace(/[^0-9.]/g, ''));

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
            type: 'detail',
            url: request.url,
            name: title,
            price,
            priceText,
            sku,
            category,
            images,
            sizes,
            colors,
            description
        });
    } catch (error: any) {
        log.error(`Error scraping detail page ${request.url}: ${error.message}`);
    }
}
