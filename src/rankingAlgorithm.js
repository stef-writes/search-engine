const { extractKeywords } = require('./searchIndex'); //  importing extractKeywords from searchIndex.js

function rankResults(index, query, searchResults) {
    const keywords = extractKeywords(query);
    let scores = new Map();

    for (let url of searchResults) {
        let score = 0;

        for (let keyword of keywords) {
            let pages = index.get(keyword) || new Set();
            if (pages.has(url)) {
                // Base score for keyword match
                score += 10;

                // Additional points if keyword appears in title or headings
                if (url.toLowerCase().includes(keyword)) {
                    score += 5;  // URL contains keyword
                }
            }
        }

        scores.set(url, score);
    }

    // Sort results by score (higher score first)
    return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by score in descending order
        .map(entry => entry[0]); // Return only the URLs
}

module.exports = { rankResults };
