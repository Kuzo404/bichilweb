# BichilWeb Frontend

Public-facing Next.js website for BichilGlobus financial services.

## Setup

1. **Install Dependencies**:
    ```bash
    npm install
    ```

2. **Environment Variables**:
    ```bash
    cp .env.example .env.local
    ```
    Edit `.env.local` with your API and media URLs.

3. **Run Development Server**:
    ```bash
    npm run dev    # Starts on port 3000
    ```

## Tech Stack

- Next.js (App Router, Turbopack)
- Tailwind CSS
- Axios (API communication with Django backend)
- Leaflet (maps for branch locations)
