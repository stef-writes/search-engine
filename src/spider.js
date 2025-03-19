const http = require('http');
const https = require('https');
const { JSDOM } = require('jsdom');
const { addPageToIndex } = require('./searchIndex');

// fetch html
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, response => {
            let data = '';

            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                if (response.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(`Error: Received status code ${response.statusCode}`);
                }
            });
        }).on('error', err => reject(`Error fetching ${url}: ${err.message}`));
    });
}

// extract content
function getAllContent(url, html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    return {
        url,
        title: document.title || "No title found",
        headings: extractHeadings(document),
        paragraphs: extractParagraphs(document),
        links: extractLinks(document, url)
    };
}

function extractHeadings(document) {
    return [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => h.textContent.trim());
}

function extractParagraphs(document) {
    return [...document.querySelectorAll('p')].map(p => p.textContent.trim());
}

function extractLinks(document, baseUrl) {
    return [...document.querySelectorAll('a')]
        .filter(a => a.href)
        .map(a => {
            const href = new URL(a.href, baseUrl).href;
            return {
                href,
                text: a.textContent.trim() || "[No Text]"
            };
        });
}

async function analyzePage(url) {
    try {
        console.log(`Fetching: ${url}`);
        const html = await fetchPage(url);
        console.log(`Extracting content from: ${url}`);
        const pageData = getAllContent(url, html);
        return pageData;
    } catch (error) {
        console.error(error);
        return null;
    }
}


async function analyzePages(urls) {
    if (typeof urls === 'string') urls = [urls];
    const results = await Promise.all(urls.map(analyzePage));
    return results.filter(result => result !== null);
}


async function crawl(urls, index) {
    if (typeof urls === 'string') urls = [urls];
    
    try {
        console.log('Starting to crawl URLs...');
        
        const crawlPromises = urls.map(async url => {
            try {
                console.log('Crawling: ' + url);
                const pageData = await analyzePage(url);
                
                if (pageData) {
                    // Combine all text content for indexing
                    const content = [
                        pageData.title,
                        ...pageData.headings,
                        ...pageData.paragraphs
                    ].join(' ');
                    
                    addPageToIndex(index, url, content);
                    console.log('Indexed: ' + url);
                    return { url, success: true };
                }
                return { url, success: false };
            } catch (error) {
                console.error('Error crawling: ' + url + ' - ' + error.message);
                return { url, success: false };
            }
        });

        return await Promise.all(crawlPromises);
    } catch (error) {
        console.error('Error in crawl operation: ' + error);
        return [];
    }
}

module.exports = { analyzePage, analyzePages, crawl };
