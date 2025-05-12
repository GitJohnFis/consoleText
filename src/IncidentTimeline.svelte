<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  interface Incident {
    id: number;
    message: string;
    time: string;
  }

  export const incidents = writable<Incident[]>([]);
  let id = 1;

  onMount(() => {
    const incidentInterval = setInterval(() => {
      incidents.update(i => [
        { id: id++, message: "High latency in service-x", time: new Date().toLocaleTimeString() },
        ...i.slice(0, 4) // Keep only the last 5 incidents
      ]);
    }, 5000);

    return () => clearInterval(incidentInterval);
  });
</script>

<style>
  .incident-container {
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    height: 400px; /* Fixed height for scrollability */
    overflow-y: auto; /* Enable vertical scrolling */
  }
  .incident { 
    background: #ffe5e5; 
    border-left: 4px solid red; 
    padding: 8px; 
    margin: 4px 0; 
    border-radius: 3px;
  }
   h2 {
    margin-top: 0;
  }
</style>

<div class="incident-container">
  <h2>🚨 Incident Timeline (PagerDuty)</h2>
  {#each $incidents as incident}
    <div class="incident">
      <strong>{incident.time}</strong>: {incident.message}
    </div>
  {/each}
</div>
