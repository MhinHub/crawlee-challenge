# 🕷️ Crawlee Scraping Course

This project contains solutions for various scraping challenges from [scrapingcourse.com](https://www.scrapingcourse.com/). It uses the [Crawlee](https://crawlee.dev/) framework with Playwright for browser automation to solve different types of web scraping tasks.

## 📋 Table of Contents

- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Available Challenges](#available-challenges)
- [Setup](#setup)
- [Running Challenges](#running-challenges)
- [Shared Components](#shared-components)
- [Output](#output)
- [Challenges List](#challenges-list)
- [Contributing](#contributing)

## 🧭 Overview

This repository provides practical solutions to various web scraping challenges, including:
- E-commerce product scraping
- Pagination handling
- Dynamic content loading
- Authentication flows
- Anti-bot protection bypassing

Each challenge demonstrates different techniques for extracting data from websites while handling common obstacles like JavaScript rendering, dynamic content, and anti-bot protections.

## 💻 Technologies Used

- [Crawlee](https://crawlee.dev/) - Web scraping and browser automation framework
- [Playwright](https://playwright.dev/) - Browser automation library
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript
- [Bun](https://bun.sh/) - JavaScript runtime (used as package manager and runner)

## 📁 Project Structure

```
crawlee-challenge/
├── challenges/                 # Challenge implementations
│   ├── ecommerce/             # E-commerce scraping challenge
│   │       └── index.ts
│   └── pagination/            # Pagination challenge
│           └── index.ts
├── shared/                    # Reusable components
│   ├── baseCrawler.ts         # Generic crawler base class
│   └── detailProductHandler.ts # Product detail page handler
├── package.json              # Project dependencies and scripts
├── bunfig.toml               # Bun configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 
```

## ⚙️ Setup

1. **Prerequisites**
   - [Bun](https://bun.sh/) installed on your system (v1.0 or higher)

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/MhinHub/crawlee-challenge
   
   # Navigate to project directory
   cd crawlee-challenge
   
   # Install dependencies
   bun install
   ```

## ▶️ Running Challenges

```bash
bun run start:<challenge>
```

## 🧩 Shared Components

### Base Crawler (`shared/baseCrawler.ts`) 
Provides a reusable base crawler with common configuration:
- Configurable start URLs, max requests, and headless mode
- Error handling for failed requests
- Automatic request queue management
- Logging utilities

### Detail Product Handler (`shared/detailProductHandler.ts`)
Extracts detailed product information including:
- Product title and SKU
- Category and price
- Product images
- Available sizes and colors
- Product description
- Other relevant metadata

## 💾 Output

Each challenge exports scraped data to CSV files in the `storage/` directory:
- Data is stored in `key_value_stores/default/<file-name>.{csv/json}` when exported challenge
- Additional data files may be created based on the specific challenge requirements
- The dataset includes all scraped information from the target websites

## 🧩 Challenges List

These are the scraping challenges available on [scrapingcourse.com](https://www.scrapingcourse.com/) (some implemented, others to be added):

- [x] **ECOMMERCE** - Ecommerce playground to scrape products and shop-related data
- [x] **PAGINATION** - Huge list of items in a paginated system
- [ ] **LOAD MORE** - Load more items by clicking the 'load more' button
- [ ] **INFINITE SCROLLING** - Infinite scrolling displays more items as you scroll down
- [ ] **LOGIN** - Login with username/email and password to see items
- [ ] **LOGIN & CSRF** - Login with CSRF-token to see protected items
- [ ] **LOGIN & CLOUDFLARE** - Bypass Cloudflare protection and Login to see protected items
- [ ] **LOGIN & CLOUDFLARE TURNSTILE** - Login and pass Cloudflare Turnstile to see protected items
- [ ] **JAVASCRIPT RENDERING** - Enable JavaScript to see items
- [ ] **TABLE PARSING** - Extract structured product data from the HTML table
- [ ] **CLOUDFLARE CHALLENGE** - Bypass the Cloudflare challenge
- [ ] **ANTIBOT CHALLENGE** - Bypass the Antibot challenge

## 🤝 Contributing

1. Create a new branch for your challenge: `git checkout -b feature/challenge-name`
2. Create a new directory in `/challenges/` for your implementation
3. Follow the same patterns as existing challenges
4. Use shared components when possible to maintain consistency
5. Add your run script to `package.json`
6. Submit a pull request with a description of the challenge and your solution

## 📄 License

This project is open source and available under the [MIT License](LICENSE).