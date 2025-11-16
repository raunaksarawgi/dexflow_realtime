# Demo Client

This directory contains demo HTML files to test the real-time DEX aggregator.

## Files

- **`test-client.html`** - Full-featured WebSocket client with real-time token updates
- **`index.html`** - Simple demo page

## Usage

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Open `test-client.html` in your browser:
   ```bash
   # On Linux
   xdg-open demo/test-client.html
   
   # On macOS
   open demo/test-client.html
   
   # On Windows
   start demo/test-client.html
   ```

3. The client will automatically connect to `http://localhost:3000` and display real-time token data.

## Features

- ✅ Real-time WebSocket connection status
- ✅ Live token price updates
- ✅ Volume spike notifications
- ✅ Sorting and filtering options
- ✅ Pagination
- ✅ Black-themed UI
- ✅ Responsive design
