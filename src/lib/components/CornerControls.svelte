<script lang="ts">
	import { Download } from 'lucide-svelte';

	let {
		onOpenExport = () => {}
	}: {
		onOpenExport: () => void;
	} = $props();
</script>

<!-- BOTTOM-LEFT: LIGHT CRYSTAL DOWNLOAD CSS BUTTON -->
<div class="bottom-left-fixed">
	<button onclick={onOpenExport} class="download-btn crystal-button" title="Export Aligned CSS">
		<Download size={24} color="#ffffff" />
	</button>
</div>

<style>
	.bottom-left-fixed {
		position: fixed;
		bottom: 32px;
		left: 32px;
		z-index: 40;
		pointer-events: none;
	}

	.download-btn {
		pointer-events: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		min-width: 0 !important;
		padding: 0 !important;
		border-radius: 9999px !important;
		transition:
			transform 0.2s ease,
			background 0.2s ease;
	}

	.download-btn:hover {
		transform: scale(1.05);
	}
</style>
