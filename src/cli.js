const readline = require('readline');
const fs = require('fs');
const { createIndex, removePageFromIndex } = require('./searchIndex');
const { search } = require('./searchAlgorithm');
const { rankResults } = require('./rankingAlgorithm');
const { analyzePage } = require('./spider');

// Create tools we need
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const index = createIndex();
const indexedUrls = new Set();

// Show menu options to the user
function showMenu() {
    console.log('\n=== Search Engine Menu ===');
    console.log('1. Add website(s)');
    console.log('2. Search');
    console.log('3. Remove a website');
    console.log('4. View indexed sites');
    console.log('5. Export data to file');
    console.log('6. Exit');
    
    rl.question('What would you like to do? (1-6): ', handleChoice);
}

function exportIndexedData() {
    if (indexedUrls.size === 0) {
        console.log('No sites have been indexed yet.');
        showMenu();
        return;
    }

    // Create CSV header
    let csvContent = 'URL,Title,Number of Headings,Number of Paragraphs,Number of Links,Top Keywords\n';
    let sitesProcessed = 0;
    const totalSites = indexedUrls.size;
    
    // Process each URL
    indexedUrls.forEach(url => {
        analyzePage(url)
            .then(pageData => {
                if (pageData) {
                    // Get keywords for this URL
                    const keywords = Array.from(index.entries())
                        .filter(([keyword, urls]) => urls.has(url))
                        .map(([keyword]) => keyword)
                        .slice(0, 5)
                        .join(' | ');

                    // Create CSV row
                    const row = [
                        url,
                        (pageData.title || '').replace(/,/g, ' '),
                        pageData.headings.length,
                        pageData.paragraphs.length,
                        pageData.links.length,
                        keywords
                    ].join(',');

                    csvContent += row + '\n';
                }
                
                sitesProcessed++;
                
                // If all sites are processed, write the file
                if (sitesProcessed === totalSites) {
                    const filename = 'search_engine_data.csv';
                    fs.writeFile(filename, csvContent, (err) => {
                        if (err) {
                            console.log('Error saving file: ' + err.message);
                        } else {
                            console.log('Data exported to: ' + filename);
                        }
                        showMenu();
                    });
                }
            })
            .catch(error => {
                console.log('Error processing ' + url + ': ' + error.message);
                sitesProcessed++;
                if (sitesProcessed === totalSites) {
                    showMenu();
                }
            });
    });
}

function handleChoice(choice) {
    if (choice === '1') {
        rl.question('Enter website URL(s) (separate multiple URLs with commas): ', (input) => {
            const urls = input.split(',').map(url => url.trim());

            for (const url of urls) {
                if (!url.startsWith('http')) {
                    console.log('Invalid URL (' + url + '): Please include http:// or https://');
                    continue;
                }
                indexedUrls.add(url);
            }

            console.log('Adding websites to index...');
            // ... rest of add website logic ...
            showMenu();
        });
    }
    // ... other existing choices ...
    else if (choice === '5') {
        exportIndexedData();
    }
    else if (choice === '6') {
        console.log('Thanks for using the Search Engine. Goodbye!');
        rl.close();
    }
    else {
        console.log('Please enter a number between 1 and 6');
        showMenu();
    }
}

// Start the program
console.log('Welcome to the Search Engine!');
showMenu();
