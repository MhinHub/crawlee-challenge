FROM oven/bun:1.1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y procps \
    && rm -rf /var/lib/apt/lists/*

COPY bun.lock bunfig.toml package.json tsconfig.json ./

RUN bun install

COPY . .

RUN mkdir -p /home/bun/.cache/ms-playwright storage \
    && chown -R bun:bun /home/bun/.cache storage /app

RUN bunx playwright install-deps chromium

USER bun

ENV PLAYWRIGHT_BROWSERS_PATH=/home/bun/.cache/ms-playwright

RUN bunx playwright install chromium

RUN bunx patchright install chromium

ENTRYPOINT ["bun"]
CMD ["run", "start:ecommerce"]
