const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const { addPageToIndex } = require('./searchIndex');
const { URL } = require('url');

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

// extract content using cheerio
function getAllContent(url, html) {
    const $ = cheerio.load(html);
    
    return {
        url,
        title: $('title').text().trim() || "No title found",
        headings: extractHeadings($),
        paragraphs: extractParagraphs($),
        links: extractLinks($, url)
    };
}

function extractHeadings($) {
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
        headings.push($(elem).text().trim());
    });
    return headings;
}

function extractParagraphs($) {
    const paragraphs = [];
    $('p').each((i, elem) => {
        paragraphs.push($(elem).text().trim());
    });
    return paragraphs;
}

function extractLinks($, baseUrl) {
    const links = [];
    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) {
            try {
                const fullUrl = new URL(href, baseUrl).href;
                links.push({
                    href: fullUrl,
                    text: $(elem).text().trim() || "[No Text]"
                });
            } catch (error) {
                // Skip invalid URLs
            }
        }
    });
    return links;
}

async function analyzePage(url) {
    try {
        console.log(`Fetching: ${url}`);
        const html = await fetchPage(url);
        console.log(`Extracting content from: ${url}`);
        const pageData = getAllContent(url, html);
        return pageData;
    } catch (error) {
        console.error(`Error analyzing ${url}: ${error}`);
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
                    const content = {
                        title: pageData.title,
                        headings: pageData.headings,
                        paragraphs: pageData.paragraphs
                    };
                    
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
