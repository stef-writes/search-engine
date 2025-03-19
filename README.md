# Search Engine Module - Detailed Breakdown

## Overview
This project implements a sophisticated search engine that can:
- Store and organize indexed web pages with weighted keyword extraction
- Allow users to search for relevant information with ranked results
- Export detailed site analytics to CSV files
- Analyze web page content including subpages and external links
- Provide an interactive command-line interface with detailed site metrics

## **1. Search Index Module**
The **Search Index Module** implements intelligent keyword extraction and indexing.

### **Functions**
#### **createIndex()**
- Creates an empty search index as a `Map` where each keyword maps to a `Set` of URLs.

#### **addPageToIndex(index, url, pageData)**
- Implements weighted keyword extraction based on HTML structure:
  - Title text (8x weight)
  - H1 headers (6x weight)
  - H2 headers (4x weight)
  - H3 headers (2x weight)
  - Regular paragraph text (1x weight)
- Uses DOM structure to prioritize important content
- Maintains keyword frequency counts for better relevance

#### **removePageFromIndex(index, url)**
- Removes URL from all keyword entries
- Cleans up orphaned keywords
- Updates index statistics

#### **extractKeywords(content)**
- Implements smart keyword extraction with:
  - Stop word filtering
  - Frequency analysis
  - Length-based filtering
  - Special character handling
- Returns keywords sorted by importance

---

## **2. Search Algorithm Module**
### **search(index, query)**
- Performs intelligent keyword matching
- Implements ranking based on:
  - Keyword frequency
  - Content location (title, headers, body)
  - Word proximity
- Returns ranked results sorted by relevance

---

## **3. Web Crawler Module**
### **analyzePages(urls)**
- Fetches and analyzes web page content
- Extracts structured data including:
  - Page title
  - Headers (h1-h6)
  - Paragraphs
  - Links (internal and external)
- Provides detailed metrics about page structure

### **getAllContent(url, html)**
- Parses DOM structure
- Extracts and categorizes content
- Identifies subpages and external links
- Maintains link relationships

---

## **4. Command-Line Interface (CLI) Module**
The CLI provides an interactive interface with the following features:

### Main Menu Options:
1. Add website(s)
   - Support for multiple URLs
   - Shows indexing progress
   - Displays extracted keywords
   
2. Search
   - Keyword-based search
   - Ranked results
   - Debug information
   
3. Remove website
   - List-based selection
   - Confirmation system
   
4. View indexed sites
   - Detailed site metrics
   - Export to CSV option
   - Site removal option
   
5. Export data to file
   - Comprehensive CSV export
   - All sites' metrics
   - Keywords and statistics
   
6. Exit

### Site Details View
Shows detailed metrics for each indexed site:
- Title and URL
- Number of subpages
- External link count
- Header and paragraph counts
- Top 10 weighted keywords
- Export to CSV option

---

## **Data Export Features**
- Individual site exports
- Bulk data exports
- CSV formatting with headers
- Comprehensive site metrics
- Keyword importance rankings

---

## **Conclusion**
This search engine provides a robust platform for web page indexing and searching, with advanced features like weighted keyword extraction, detailed site analytics, and data export capabilities. The command-line interface offers an intuitive way to interact with all features while providing detailed insights into indexed content.