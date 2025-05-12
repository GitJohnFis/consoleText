<script lang="ts">
  import LogStream from './LogStream.svelte';
  import IncidentTimeline from './IncidentTimeline.svelte';
</script>

<div style="display: flex; gap: 2rem; justify-content: space-between;">
  <div style="flex: 1;"><LogStream /></div>
  <div style="flex: 1;"><IncidentTimeline /></div>
</div>
