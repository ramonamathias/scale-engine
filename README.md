# ScaleEngine - Distributed Task Queue

A distributed task queue built with Node.js and Redis to handle heavy background jobs (like PDF generation) asynchronously without blocking the main Express server.

It uses the Competing Consumers pattern, meaning you can spin up multiple worker processes to handle the queue in parallel.

## Tech Stack
- Backend: Node.js, Express
- Message Broker: Redis
- PDF Generation: PDFKit

## How It Works
- The Express Server accepts incoming tasks and pushes them into a Redis queue. It immediately returns a 202 Accepted status to the client.
- The Workers listen to the Redis queue, pull tasks off sequentially using atomic commands, and process the heavy PDF generation completely in the background.

## Setup and Installation

### 1. Install dependencies
Run this command in your terminal:
```bash
npm install

### 2. Run Redis
Make sure your local Redis server is running.

### 3. Start the API server
Run this command in your terminal:
```bash
node server.js

### 4. Start a worker
Run this command in a separate terminal:
```bash
node worker.js