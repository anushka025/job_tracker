# LinkedIn Job Tracker Chrome Extension

A Chrome extension that lets you save LinkedIn job postings directly into a personal job tracking dashboard with one click.

## 🚀 Features

- Adds a **“Save to JobTracker” button** directly to LinkedIn job search results
- Extracts:
  - Job title
  - Company name
  - Location
  - Unique job link
- Prevents duplicate job entries
- Stores applications in a Supabase backend
- Handles LinkedIn’s dynamic and obfuscated DOM structure

## 🧠 Technical Highlights

- Built a **robust DOM parsing system** to handle LinkedIn’s frequently changing UI
- Designed fallback strategies for extracting structured data from unstructured job cards
- Implemented **duplicate detection logic** using normalized job links
- Uses **MutationObserver** to dynamically inject UI into LinkedIn pages
- Handles authentication using Supabase JWT tokens

## 🛠 Tech Stack

- JavaScript (Chrome Extension APIs)
- Supabase (Database + Auth)
- HTML/CSS (Extension UI)
- LinkedIn DOM reverse engineering

## ⚡ Challenges Solved

- LinkedIn uses **obfuscated class names**, so selectors had to rely on:
  - aria-labels
  - partial attribute matching
  - DOM traversal strategies
- Job metadata is **not co-located**, requiring:
  - intelligent parent traversal
  - selector ranking
- Avoiding incorrect data like:
  - "About" instead of company name
  - "Remote" instead of actual location

## 📸 Demo

(Add screenshots or screen recording here)

## 🧩 How it works

1. Detects LinkedIn job cards using DOM observation
2. Injects a “Save” button next to each job
3. Extracts structured data from the job card
4. Sends data to Supabase
5. Prevents duplicates using job link normalization

## 🔐 Authentication

- Uses Supabase JWT stored in Chrome local storage
- Automatically prompts login if user is not authenticated

## 📌 Future Improvements

- Add job status tracking (Applied, Interviewing, Rejected)
- Sync across devices
- AI-powered job insights / matching

## 👤 Author

Anushka Pandey  
