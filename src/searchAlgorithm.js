const { getPagesForKeyword, extractKeywords } = require('./searchIndex');

function search(index, query) {
    const keywords = extractKeywords(query); // Step 1: Extract keywords from the query
    if (keywords.length === 0) return []; // If no keywords, return an empty array

    let results = new Map(); // Map to store URLs and their relevance score

    for (let keyword of keywords) {  // Step 2: Retrieve pages for each keyword
        let pages = getPagesForKeyword(index, keyword); // Get URLs for this keyword
        
        for (let page of pages) { 
            if (results.has(page)) {
                results.set(page, results.get(page) + 1); // Increase score if page appears multiple times
            } else {
                results.set(page, 1); // Otherwise, add page with a score of 1
            }
        }
    }

    return Array.from(results.entries()) // Step 3: Sort results by relevance (higher score = higher relevance)
        .sort((a, b) => b[1] - a[1]) // Sort by score (descending order)
        .map(entry => entry[0]); // Return only the URLs
}

module.exports = { search };
