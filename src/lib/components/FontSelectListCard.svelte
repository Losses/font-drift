<script lang="ts">
	import type { CustomFont } from '$lib/types';

	let {
		fonts = [],
		onSelectFont = () => {}
	}: {
		fonts: CustomFont[];
		onSelectFont: (font: CustomFont) => void;
	} = $props();
</script>

<div class="blueprint-card font-list-card">
	<div class="card-row-item list-header">SELECT FONT</div>
	<div class="list-scroll-area">
		{#each fonts as font (font.id)}
			<button onclick={() => onSelectFont(font)} class="card-row-item font-select-btn">
				<span>{font.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.font-list-card {
		display: flex;
		flex-direction: column;
		font-family: monospace;
		font-size: 12px;
		border: 1.5px solid #dbe8f8;
		max-height: 320px;
		padding: 0 !important;
		width: 100%;
		max-width: 360px;
	}

	.list-header {
		width: 100%;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		padding-left: 0.5em !important;
		padding-right: 0.5em !important;
		border-bottom: 1px solid #dbe8f8;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		line-height: 2;
	}

	.list-scroll-area {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-right: 4px;
	}

	.font-select-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		padding-left: 0.5em !important;
		padding-right: 0.5em !important;
		background: transparent;
		color: #ffffff;
		font-family: monospace;
		border: none;
		border-bottom: 1px solid rgba(219, 232, 248, 0.15);
		cursor: pointer;
		line-height: 2;
		transition: background-color 0.15s ease;
	}

	.font-select-btn:last-child {
		border-bottom: none;
	}

	.font-select-btn:hover {
		background-color: rgba(255, 255, 255, 0.15);
	}
</style>
