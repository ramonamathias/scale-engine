# ScaleEngine - Distributed Task Queue

A distributed task queue built with Node.js and Redis to handle heavy background jobs (like PDF generation) asynchronously without blocking the main Express server. 

It uses the Competing Consumers pattern, meaning you can spin up multiple worker processes to handle the queue in parallel.

## Tech Stack
* **Backend:** Node.js, Express
* **Message Broker / Queue:** Redis
* **PDF Generation:** PDFKit

## How It Works
1. The **Express Server** (`server.js`) accepts incoming tasks and pushes them into a Redis queue. It immediately returns a `202 Accepted` status to the client.
2. The **Workers** (`worker.js`) listen to the Redis queue, pull tasks off sequentially using atomic commands, and process the heavy PDF generation completely in the background.

## Setup & Installation

1. Install dependencies:
   ```bash
   npm install
Make sure your local Redis server is running.

Start the main API server:

Bash
node server.js
Start a background worker in a separate terminal:

Bash
node worker.js