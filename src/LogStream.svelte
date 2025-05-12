<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  export const logs = writable<string[]>([]);

  let interval: any;

  onMount(() => {
    interval = setInterval(() => {
      // Simulate live log entries
      logs.update(l => [
        `[${new Date().toISOString()}] ERROR: Simulated log entry`,
        ...l.slice(0, 9) // Keep only the last 10 logs
      ]);
    }, 2000);

    return () => clearInterval(interval);
  });
</script>

<style>
  .log-container {
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    height: 400px; /* Fixed height for scrollability */
    overflow-y: auto; /* Enable vertical scrolling */
  }
  .log-entry { 
    font-family: monospace; 
    background: #1e1e1e; 
    color: #eee; 
    padding: 6px; 
    margin: 2px 0; 
    border-radius: 3px;
    font-size: 0.85rem;
  }
  h2 {
    margin-top: 0;
  }
</style>

<div class="log-container">
  <h2>📄 Log Stream (Datadog)</h2>
  {#each $logs as log}
    <div class="log-entry">{log}</div>
  {/each}
</div>
