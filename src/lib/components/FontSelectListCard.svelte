<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { CustomFont } from '$lib/types';

	let {
		fonts = [],
		onSelectFont = () => {},
		onDeleteFont = () => {}
	}: {
		fonts: CustomFont[];
		onSelectFont: (font: CustomFont) => void;
		onDeleteFont?: (font: CustomFont) => void;
	} = $props();
</script>

<div class="blueprint-card font-list-card">
	<div class="card-row-item list-header">SELECT FONT</div>
	<div class="list-scroll-area">
		{#each fonts as font (font.id)}
			<div class="font-item-row">
				<button onclick={() => onSelectFont(font)} class="card-row-item font-select-btn">
					<span>{font.name}</span>
					{#if font.isCustom}
						<span class="custom-badge">CUSTOM</span>
					{/if}
				</button>
				{#if font.isCustom}
					<button
						onclick={(e) => {
							e.stopPropagation();
							onDeleteFont(font);
						}}
						class="delete-font-btn"
						title="Delete custom font"
					>
						<Trash2 size={12} color="#ff8a80" />
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.font-item-row {
		display: flex;
		align-items: center;
		width: 100%;
		border-bottom: 1px solid rgba(219, 232, 248, 0.15);
	}

	.font-item-row:last-child {
		border-bottom: none;
	}

	.delete-font-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: opacity 0.15s ease;
	}

	.delete-font-btn:hover {
		opacity: 1;
	}

	.custom-badge {
		font-size: 9px;
		font-weight: 700;
		background: #a7ffeb;
		color: #060b19;
		padding: 1px 4px;
		border-radius: 2px;
		letter-spacing: 0.05em;
		margin-left: 6px;
	}

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
		flex: 1;
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
		cursor: pointer;
		line-height: 2;
		transition: background-color 0.15s ease;
	}

	.font-select-btn:hover {
		background-color: rgba(255, 255, 255, 0.15);
	}
</style>
