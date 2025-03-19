const readline = require('readline');
const fs = require('fs');
const { createIndex, removePageFromIndex, addPageToIndex, extractKeywords } = require('./searchIndex');
const { search } = require('./searchAlgorithm');
const { rankResults } = require('./rankingAlgorithm');
const { analyzePages } = require('./spider');

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
        analyzePages(url)
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

function viewSiteDetails(url) {
    console.log('\nAnalyzing site: ' + url);
    let siteData; // Declare variable in outer scope
    
    analyzePages(url)
        .then(pageData => {
            if (pageData && pageData[0]) {
                siteData = pageData[0];
                console.log('\n=== Site Overview ===');
                console.log('Title: ' + siteData.title);
                
                // Count unique subpages (links that are part of the same domain)
                const subpages = siteData.links
                    .filter(link => link.href.includes(new URL(url).hostname))
                    .length;
                
                // Count external links
                const externalLinks = siteData.links.length - subpages;

                // Get keywords for this URL from the index
                const keywords = Array.from(index.entries())
                    .filter(([keyword, urls]) => urls.has(url))
                    .map(([keyword]) => keyword)
                    .slice(0, 10);

                // Display key metrics
                console.log('\nKey Metrics:');
                console.log('• Subpages found: ' + subpages);
                console.log('• External links: ' + externalLinks);
                console.log('• Total headings: ' + siteData.headings.length);
                console.log('• Paragraphs: ' + siteData.paragraphs.length);
                
                console.log('\nTop Keywords:');
                if (keywords.length > 0) {
                    keywords.forEach((keyword, i) => {
                        console.log('  ' + (i + 1) + '. ' + keyword);
                    });
                } else {
                    console.log('  No keywords found');
                }

                // Show options
                console.log('\nOptions:');
                console.log('1. Export site data as CSV');
                console.log('2. Return to menu');
                console.log('3. Remove this site');
                
                rl.question('Choose an option (1-3): ', (choice) => {
                    if (choice === '1' && siteData) {
                        // Create CSV content for single site
                        const csvHeader = 'URL,Title,Subpages,External Links,Total Headings,Paragraphs,Top Keywords\n';
                        const csvRow = [
                            url,
                            (siteData.title || '').replace(/,/g, ' '),
                            subpages,
                            externalLinks,
                            siteData.headings.length,
                            siteData.paragraphs.length,
                            keywords.join(' | ')
                        ].join(',');

                        const csvContent = csvHeader + csvRow;
                        const filename = `site_data_${new URL(url).hostname.replace(/\./g, '_')}.csv`;

                        fs.writeFile(filename, csvContent, (err) => {
                            if (err) {
                                console.log('Error saving file: ' + err.message);
                            } else {
                                console.log('Data exported to: ' + filename);
                            }
                            showMenu();
                        });
                    }
                    else if (choice === '3') {
                        removePageFromIndex(index, url);
                        indexedUrls.delete(url);
                        console.log('Site removed from index.');
                        showMenu();
                    }
                    else {
                        showMenu();
                    }
                });
            } else {
                console.log('Error: Could not fetch site details');
                showMenu();
            }
        })
        .catch(error => {
            console.log('Error getting site details: ' + error);
            showMenu();
        });
}

// Function to handle user input
function handleChoice(choice) {
    // Convert choice to string for comparison
    choice = String(choice).trim();

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
            analyzePages(urls).then(pagesData => {
                pagesData.forEach(pageData => {
                    if (pageData) {
                        // Pass the structured data directly for better keyword extraction
                        addPageToIndex(index, pageData.url, pageData);
                        
                        // Debug log to show extracted keywords
                        const keywords = Array.from(index.entries())
                            .filter(([keyword, urls]) => urls.has(pageData.url))
                            .map(([keyword]) => keyword)
                            .slice(0, 10);
                        console.log('\nIndexed:', pageData.url);
                        console.log('Title:', pageData.title);
                        console.log('Top 10 keywords (weighted by importance):');
                        keywords.forEach((keyword, i) => {
                            console.log(`  ${i + 1}. ${keyword}`);
                        });
                    }
                });
                console.log('\nWebsites added! (Please wait a few seconds before searching)');
                showMenu();
            }).catch(error => {
                console.log('Error adding websites: ' + error);
                showMenu();
            });
        });
    }
    else if (choice === '2') {
        rl.question('What would you like to search for? ', (searchTerm) => {
            if (!searchTerm.trim()) {
                console.log('Please enter something to search for');
                showMenu();
                return;
            }

            // Debug log to show search process
            console.log('\nSearching for:', searchTerm);
            const keywords = extractKeywords(searchTerm);
            console.log('Extracted search keywords:', keywords);

            const results = search(index, searchTerm);
            const rankedResults = rankResults(index, searchTerm, results);

            console.log('\nSearch Results:');
            if (rankedResults.length === 0) {
                console.log('No results found');
                // Debug information
                console.log('\nDebug Info:');
                console.log('Total indexed URLs:', indexedUrls.size);
                console.log('Total indexed keywords:', index.size);
            } else {
                rankedResults.forEach((url, i) => {
                    console.log((i + 1) + '. ' + url);
                });
            }
            showMenu();
        });
    }
    else if (choice === '3') {
        console.log('\nIndexed Sites:');
        if (indexedUrls.size === 0) {
            console.log('No sites have been indexed yet.');
            showMenu();
            return;
        }

        const sites = Array.from(indexedUrls);
        sites.forEach((url, i) => {
            console.log((i + 1) + '. ' + url);
        });

        rl.question('\nEnter site number to remove (or press Enter to cancel): ', (siteChoice) => {
            const siteIndex = parseInt(siteChoice) - 1;
            if (siteIndex >= 0 && siteIndex < sites.length) {
                const url = sites[siteIndex];
                removePageFromIndex(index, url);
                indexedUrls.delete(url);
                console.log('Website removed:', url);
            } else if (siteChoice.trim() !== '') {
                console.log('Invalid site number');
            }
            showMenu();
        });
    }
    else if (choice === '4') {
        console.log('\nIndexed Sites:');
        if (indexedUrls.size === 0) {
            console.log('No sites have been indexed yet.');
            showMenu();
            return;
        }

        const sites = Array.from(indexedUrls);
        sites.forEach((url, i) => {
            console.log((i + 1) + '. ' + url);
        });

        console.log('\nOptions:');
        console.log('1. View site details');
        console.log('2. Return to menu');

        rl.question('Choose an option (1-2): ', (choice) => {
            if (choice === '1') {
                rl.question('Enter site number: ', (siteChoice) => {
                    const index = parseInt(siteChoice) - 1;
                    if (index >= 0 && index < sites.length) {
                        viewSiteDetails(sites[index]);
                        return;
                    }
                    showMenu();
                });
            } else {
                showMenu();
            }
        });
    }
    else if (choice === '5') {
        exportIndexedData();
    }
    else if (choice === '6') {
        console.log('Thanks for using the Search Engine. Goodbye!');
        rl.close();
        return;
    }
    else {
        console.log('Please enter a number between 1 and 6');
        showMenu();
    }
}

// Start the program
console.log('Welcome to the Search Engine!');
showMenu();
