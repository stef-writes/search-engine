# Search Engine Module - Detailed Breakdown

## Overview
This project implements a basic search engine that can:
- Store and organize indexed web pages
- Allow users to search for relevant information
- Rank search results based on relevance
- Fetch and analyze web page content
- Interact with users via a command-line interface

## **1. Search Index Module**
The **Search Index Module** is responsible for storing and organizing indexed web pages so users can search for relevant information efficiently.

### **Functions**
#### **createIndex()**
- Creates an empty search index as a `Map` where each keyword maps to a `Set` of URLs.

#### **addPageToIndex(index, url, pageContent)**
- Extracts keywords from the page content and associates the URL with each keyword.
- Uses a `Set` to store URLs, preventing duplicates.

#### **updatePageInIndex(index, url, newPageContent)**
- First removes the page from the index, then re-adds it with updated content.

#### **removePageFromIndex(index, url)**
- Loops through all keywords and removes the specified URL.
- Deletes keywords from the index if they no longer have any associated URLs.

#### **getPagesForKeyword(index, keyword)**
- Retrieves an array of pages that contain the given keyword.
- Returns an empty array if the keyword is not found.

#### **extractKeywords(pageContent)**
- Converts text to lowercase, removes punctuation, and splits it into words.
- Filters out common stop words and short words.
- Sorts keywords by frequency, prioritizing important words.

---

## **2. Search Algorithm Module**
### **search(index, query)**
- Extracts keywords from the search query and retrieves relevant pages.
- Uses a `Map` to count keyword matches across pages.
- Sorts results by relevance, with pages having more matches ranked higher.

---

## **3. Web Crawler Module**
### **fetchPage(url)**
- Retrieves the HTML content of a web page using HTTP/HTTPS requests.
- Handles errors if a page cannot be fetched.

### **crawl(urls, index)**
- Iterates through a list of URLs, fetches content, extracts meaningful text, and adds it to the index.
- Uses `Promise.all` to handle multiple page requests efficiently.
- Handles failures gracefully and continues indexing other pages.

---

## **4. Command-Line Interface (CLI) Module**
The CLI module allows users to:
- Add websites to the index
- Search for information
- Remove websites from the index
- View indexed sites

It uses the `readline` module to interact with users and provides a menu-driven interface.

### **showMenu()**
- Displays options and processes user input for various search operations.

---

## **Conclusion**
This search engine efficiently indexes, searches, and ranks web pages, providing a simple but effective search tool using JavaScript.

