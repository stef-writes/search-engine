const readline = require('readline');
const fs = require('fs');
const { createIndex, removePageFromIndex, addPageToIndex, extractKeywords } = require('./searchIndex');
const { search } = require('./searchAlgorithm');
const { rankResults } = require('./rankingAlgorithm');
const { analyzePages } = require('./spider');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const index = createIndex();
const indexedUrls = new Set();

// Show menu 
function showMenu() {
    console.log('\n=== Search Engine Menu ===');
    console.log('1. Add website(s)');
    console.log('2. Search');
    console.log('3. Remove a website');
    console.log('4. View indexed sites');
    console.log('5. Exit');
    
    rl.question('What would you like to do? (1-5): ', handleChoice);
}

function exportSiteData(url, siteData) {
    try {
        // Get keywords for this URL from the index
        const keywords = Array.from(index.entries())
            .filter(([keyword, urls]) => urls.has(url))
            .map(([keyword]) => keyword)
            .slice(0, 10);

        // Create CSV content for single site
        const csvHeader = 'URL,Title,Subpages,External Links,Total Headings,Paragraphs,Top Keywords\n';
        const subpages = siteData.links.filter(link => link.href.includes(new URL(url).hostname)).length;
        const externalLinks = siteData.links.length - subpages;
        
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
            showSiteOptions(url, siteData);
        });
    } catch (error) {
        console.log('Error exporting data: ' + error.message);
        showSiteOptions(url, siteData);
    }
}

function showSiteOptions(url, siteData) {
    console.log('\nSite Options:');
    console.log('1. View hyperlinks');
    console.log('2. Export site data');
    console.log('3. Remove this site');
    console.log('4. Return to menu');

    rl.question('Choose an option (1-4): ', (choice) => {
        if (choice === '1') {
            viewAndAddHyperlinks(url);
        } else if (choice === '2') {
            exportSiteData(url, siteData);
        } else if (choice === '3') {
            removePageFromIndex(index, url);
            indexedUrls.delete(url);
            console.log('Site removed from index.');
            showMenu();
        } else {
            showMenu();
        }
    });
}

function viewSiteDetails(url) {
    console.log('\nAnalyzing site: ' + url);
    
    analyzePages(url)
        .then(pageData => {
            if (pageData && pageData[0]) {
                const siteData = pageData[0];
                console.log('\n=== Site Overview ===');
                console.log('Title: ' + siteData.title);
                
                // Count unique subpages 
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

                showSiteOptions(url, siteData);
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

// Function to view and optionally add hyperlinks
async function viewAndAddHyperlinks(url) {
    try {
        console.log('\nAnalyzing site for hyperlinks:', url);
        const results = await analyzePages(url);
        
        if (results && results[0] && results[0].links) {
            const links = results[0].links;
            console.log(`\nFound ${links.length} hyperlinks:`);
            
            // Display links with numbers
            links.forEach((link, index) => {
                console.log(`${index + 1}. ${link.text} (${link.href})`);
            });
            
            // Ask if user wants to add any links
            console.log('\nOptions:');
            console.log('1. Add specific links to index');
            console.log('2. Add all links to index');
            console.log('3. Return to menu');
            
            rl.question('Choose an option (1-3): ', async (choice) => {
                if (choice === '1') {
                    rl.question('Enter link numbers to add (comma-separated, e.g., 1,3,5): ', async (numbers) => {
                        const selectedIndices = numbers.split(',').map(n => parseInt(n.trim()) - 1);
                        const selectedUrls = selectedIndices
                            .filter(i => i >= 0 && i < links.length)
                            .map(i => links[i].href);
                        
                        console.log('\nAdding selected links to index...');
                        for (const url of selectedUrls) {
                            indexedUrls.add(url);
                        }
                        const results = await analyzePages(selectedUrls);
                        results.forEach(pageData => {
                            if (pageData) {
                                addPageToIndex(index, pageData.url, pageData);
                                console.log('Added:', pageData.url);
                            }
                        });
                        showMenu();
                    });
                } else if (choice === '2') {
                    console.log('\nAdding all links to index...');
                    const urls = links.map(link => link.href);
                    for (const url of urls) {
                        indexedUrls.add(url);
                    }
                    const results = await analyzePages(urls);
                    results.forEach(pageData => {
                        if (pageData) {
                            addPageToIndex(index, pageData.url, pageData);
                            console.log('Added:', pageData.url);
                        }
                    });
                    showMenu();
                } else {
                    showMenu();
                }
            });
        } else {
            console.log('No hyperlinks found or error analyzing page');
            showMenu();
        }
    } catch (error) {
        console.error('Error:', error);
        showMenu();
    }
}

// Function to handle user input
function handleChoice(choice) {
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
                        addPageToIndex(index, pageData.url, pageData);
                        console.log('\nIndexed:', pageData.url);
                        console.log('Title:', pageData.title);
                    }
                });
                console.log('\nWebsites added!');
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

            const results = search(index, searchTerm);
            const rankedResults = rankResults(index, searchTerm, results);

            console.log('\nSearch Results:');
            if (rankedResults.length === 0) {
                console.log('No results found');
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

        rl.question('\nEnter site number to view details: ', (siteChoice) => {
            const siteIndex = parseInt(siteChoice) - 1;
            if (siteIndex >= 0 && siteIndex < sites.length) {
                viewSiteDetails(sites[siteIndex]);
            } else {
                console.log('Invalid site number');
                showMenu();
            }
        });
    }
    else if (choice === '5') {
        console.log('Thanks for using the Search Engine. Goodbye!');
        rl.close();
        return;
    }
    else {
        console.log('Please enter a number between 1 and 5');
        showMenu();
    }
}

// Start the program
console.log('Welcome to the Search Engine!');
showMenu();
