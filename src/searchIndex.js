// Search Index Module --> for storing and organizing indexed web pages so that users can search for relevant information efficiently.

function createIndex() { // Purpose: create an empty search index
    return new Map(); // Empty data structure object (dictionary)
}

function addPageToIndex(index, url, pageData) {
    // Combine content with weights
    let content = '';
    
    // Title gets highest weight (x8)
    if (pageData.title) {
        for (let i = 0; i < 8; i++) {
            content += pageData.title + ' ';
        }
    }

    // Headers get weighted by importance
    if (pageData.headings) {
        pageData.headings.forEach(heading => {
            const weight = heading.startsWith('h1') ? 6 :
                          heading.startsWith('h2') ? 4 :
                          heading.startsWith('h3') ? 2 : 1;
            
            for (let i = 0; i < weight; i++) {
                content += heading + ' ';
            }
        });
    }

    // Add paragraphs (normal weight)
    if (pageData.paragraphs) {
        content += pageData.paragraphs.join(' ');
    }

    // Add link text (lower weight)
    if (pageData.links) {
        content += ' ' + pageData.links.map(link => link.text).join(' ');
    }

    // Extract and store keywords
    const keywords = extractKeywords(content);
    
    // Clear any existing entries for this URL
    removePageFromIndex(index, url);
    
    // Add new keywords
    keywords.forEach(keyword => {
        if (index.has(keyword)) {
            index.get(keyword).add(url);
        } else {
            index.set(keyword, new Set([url]));
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

function extractKeywords(content) {
    let text = content.toLowerCase();
    text = text.replace(/[^\w\s-]/g, ' ');
    let words = text.split(/\s+/);

    // Filter out stop words and count frequencies
    const keywordCounts = new Map();
    words.forEach(word => {
        if (word && !stopWords.has(word) && word.length > 2) {
            keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        }
    });

    // Sort by frequency and return
    return Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
}

// Updated stop words list to be more comprehensive but not too restrictive
const stopWords = new Set([
    'are','such','some','the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do',
    'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
    'say', 'her', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
    'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
    'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
    'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people'
]);

module.exports = {
    createIndex,
    addPageToIndex,
    updatePageInIndex,
    removePageFromIndex,
    getPagesForKeyword,
    extractKeywords
}
