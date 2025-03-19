const { getPagesForKeyword, extractKeywords } = require('./searchIndex');
const { rankResults } = require('./rankingAlgorithm'); // Import ranking function

function search(index, query) {
    const keywords = extractKeywords(query);
    if (keywords.length === 0) return []; // Return empty array if no keywords

    let results = new Set(); // Use a Set to avoid duplicate URLs

    for (let keyword of keywords) {
        let pages = getPagesForKeyword(index, keyword);
        pages.forEach(page => results.add(page)); // Collect all pages matching the query
    }

    // Convert Set to array and rank results before returning
    return rankResults(index, query, Array.from(results));
}

module.exports = { search };
