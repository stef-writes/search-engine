// Search Index Module --> for storing and organizing indexed web pages so that users can search for relevant information efficiently.

function createIndex() { // Purpose: create an empty search index
    return new Map(); // Empty data structure object (dictionary)
}

function addPageToIndex(index, url, pageContent) { // Purpose: add a new page to the index
    const keywords = extractKeywords(pageContent);  // Step 1: Extract keywords from the page content
    
    keywords.forEach(keyword => { // Step 2: Add the URL to the index under each extracted keyword
        if (index.has(keyword)) {  
            index.get(keyword).add(url); // Add URL to the existing Set
        } else {
            index.set(keyword, new Set([url])); // Create a new Set with the URL
        }
    });
}

function updatePageInIndex(index, url, newPageContent) { // Purpose: update an existing page in the index
    removePageFromIndex(index, url); // Step 1: Remove the existing entry for the URL
    addPageToIndex(index, url, newPageContent); // Step 2: Add the updated content back into the index
}

function removePageFromIndex(index, url) { // Purpose: remove a page from the index
    for (let [keyword, urls] of index) {  // Loop through each keyword and its Set of URLs
        if (urls.has(url)) {  // Check if the URL exists for this keyword
            urls.delete(url);  // Remove the URL from the Set
            
            if (urls.size === 0) {  // If the Set is empty, remove the keyword from the index
                index.delete(keyword);
            }
        }
    }
}

function getPagesForKeyword(index, keyword) { // Purpose: retrieve pages related to a given keyword
    if (index.has(keyword)) {  // Step 1: Check if keyword exists in index
        return Array.from(index.get(keyword));  // Step 2: Convert Set to an array and return
    }
    return [];  // Step 3: Return an empty array if the keyword is not found
}

function extractKeywords(pageContent) {
    let text = pageContent.toLowerCase(); // Step 1: Convert text to lowercase
    text = text.replace(/[^\w\s]/g, '');  // Step 2: Remove punctuation
    let words = text.split(/\s+/); // Step 3: Split text into individual words

    // Expanded list of common stop words
    const stopWords = new Set([
        "the", "and", "is", "a", "about", "this", "of", "for", "to", "in", "on", "with", "that", "by", "it", "as", "you",
        "i", "me", "my", "we", "our", "ours", "us", "he", "him", "his", "she", "her", "hers", "they", "them", "their", "theirs",
        "at", "from", "was", "were", "be", "been", "are", "but", "not", "or", "so", "if", "then", "than", "because",
        "what", "which", "who", "whom", "where", "when", "how", "why", "can", "much", "there", "could"
    ]);

    
    let keywordCounts = new Map(); // Step 4: Filter out stop words and short words
    words.forEach(word => {
        if (!stopWords.has(word) && word.length > 2) { // Ensure it's not a stop word and is meaningful
            keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        }
    });

    
    let sortedKeywords = Array.from(keywordCounts.entries()) // Step 5: Sort keywords by frequency (most important words first)
        .sort((a, b) => b[1] - a[1]) // Sort by count (descending order)
        .map(entry => entry[0]); // Keep only the words, not the counts

    return sortedKeywords;
}

module.exports = {
    createIndex,
    addPageToIndex,
    updatePageInIndex,
    removePageFromIndex,
    getPagesForKeyword,
    extractKeywords
}
