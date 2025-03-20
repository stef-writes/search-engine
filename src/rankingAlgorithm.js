const { extractKeywords } = require('./searchIndex');

function rankResults(index, query, searchResults) {
    const keywords = extractKeywords(query);
    let scores = new Map();

    for (let url of searchResults) {
        let score = 0;
        let pageContent = ""; 

        for (let keyword of keywords) {
            let pages = index.get(keyword) || new Set();

            if (pages.has(url)) {
                score += 10; 
            }
        }

        // Fetch content (title, headings, body) from the indexed page
        for (let [keyword, urls] of index.entries()) {
            if (urls.has(url)) {
                pageContent += " " + keyword; 
            }
        }

        // Count keyword frequency in the page content
        for (let keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, "gi");
            const matches = pageContent.match(regex);
            const keywordCount = matches ? matches.length : 0;

            score += keywordCount * 2; // Weight keyword frequency higher
        }

        // Prioritize title & headings 
        if (url.toLowerCase().includes(query.toLowerCase())) {
            score += 20; 
        }

        scores.set(url, score);
    }

    // Sort results
    return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1]) 
        .map(entry => entry[0]); 
}

module.exports = { rankResults };
