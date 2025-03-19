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
                score += 10; // Base score for keyword match
            }
        }

        // Fetch content (title, headings, body) from the indexed page
        for (let [keyword, urls] of index.entries()) {
            if (urls.has(url)) {
                pageContent += " " + keyword; // Simulating full text of the page
            }
        }

        // Count keyword frequency in the page content
        for (let keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, "gi");
            const matches = pageContent.match(regex);
            const keywordCount = matches ? matches.length : 0;

            score += keywordCount * 2; // Weight keyword frequency higher
        }

        // Prioritize title & headings if present
        if (url.toLowerCase().includes(query.toLowerCase())) {
            score += 20; // Title contains the keyword
        }

        scores.set(url, score);
    }

    // Sort results by score (higher score first)
    return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by score in descending order
        .map(entry => entry[0]); // Return only the URLs
}

module.exports = { rankResults };
