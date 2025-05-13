# console.text - Svelte Edition

This is a Svelte application for displaying a simulated log stream and incident timeline.

## Core Features (Simulated):

-   **Log Stream**: Displays simulated log entries, mimicking a Datadog-like feed.
-   **Incident Timeline**: Shows simulated incident alerts, akin to a PagerDuty timeline.

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002` (or another port if 9002 is taken).

## Available Scripts

-   `npm run dev`: Starts the Vite development server.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Serves the production build locally for preview.
-   `npm run check`: Runs Svelte type checking.
## Logging for all tingz
[![Run Datadog Synthetic tests](https://github.com/GitJohnFis/consoleText/actions/workflows/datadog-synthetics.yml/badge.svg)](https://github.com/GitJohnFis/consoleText/actions/workflows/datadog-synthetics.yml)
