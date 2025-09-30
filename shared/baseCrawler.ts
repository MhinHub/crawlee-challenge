import { PlaywrightCrawler, Dataset, PlaywrightCrawlingContext } from 'crawlee';

export type Awaitable<T> = T | Promise<T>;

export interface BaseCrawlerOptions {
    startUrls: string[];
    maxRequests?: number;
    headless?: boolean;
    requestHandler: (ctx: PlaywrightCrawlingContext) => Awaitable<void>;
}


export function createBaseCrawler(options: BaseCrawlerOptions) {
    const crawler = new PlaywrightCrawler({
        headless: options.headless ?? true,
        maxRequestsPerCrawl: options.maxRequests ?? 50,
        requestHandler: options.requestHandler, // now compatible with Router
        async failedRequestHandler({ request, error, log }) {
            let message = '';
            if (error instanceof Error) message = error.message;
            else if (typeof error === 'string') message = error;
            else message = JSON.stringify(error);

            log.error(`❌ Failed ${request.url}: ${message}`);
            await Dataset.pushData({ url: request.url, error: message });
        },
    });

    return {
        crawler,
        run: async (startLabel?: string) => {
            const startRequests = options.startUrls.map(url => ({ url, label: startLabel }));
            await crawler.run(startRequests);
            await crawler.stop()
        },
    };
}
