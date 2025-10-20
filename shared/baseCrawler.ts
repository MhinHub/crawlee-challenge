import { PlaywrightCrawler, PlaywrightCrawlerOptions } from 'crawlee';

export interface BaseCrawlerOptions extends PlaywrightCrawlerOptions {
    startUrls: string[];
    maxRequests?: number;
}

export function createBaseCrawler(options: BaseCrawlerOptions) {
    const { startUrls, maxRequests, ...restOptions } = options;

    const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: maxRequests ?? 50,
        ...restOptions,
    });


    return {
        crawler,
        run: async (startLabel?: string) => {
            const startRequests = startUrls.map(url => ({ url, label: startLabel }));
            await crawler.run(startRequests);
            await crawler.autoscaledPool?.abort();
        },
    };
}