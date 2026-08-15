<script lang="ts">
	import { X, ArrowLeft } from 'lucide-svelte';

	let {
		showBaselines = $bindable(true),
		showOverlay = $bindable(true),
		useMetricOverrides = $bindable(false),
		onReturnToSelection = () => {}
	}: {
		showBaselines: boolean;
		showOverlay: boolean;
		useMetricOverrides: boolean;
		onReturnToSelection: () => void;
	} = $props();
</script>

<!-- TOP-LEFT: RETURN BUTTON -->
<div class="top-left-fixed">
	<button
		onclick={onReturnToSelection}
		class="return-btn crystal-button"
		title="Return to Font Selection"
	>
		<ArrowLeft size={24} color="#ffffff" />
	</button>
</div>

<!-- TOP-RIGHT: OPTION CHECKBOX TOGGLES CONTAINER -->
<div class="top-right-fixed">
	<div class="toggles-card blueprint-card">
		<!-- Toggle 1: Baselines -->
		<button onclick={() => (showBaselines = !showBaselines)} class="toggle-btn">
			<div class="checkbox-box">
				{#if showBaselines}
					<X size={14} color="#ffffff" strokeWidth={3} />
				{/if}
			</div>
			<span class="toggle-label">SHOW BASELINES</span>
		</button>

		<!-- Toggle 2: Overlay -->
		<button onclick={() => (showOverlay = !showOverlay)} class="toggle-btn toggle-btn-middle">
			<div class="checkbox-box">
				{#if showOverlay}
					<X size={14} color="#ffffff" strokeWidth={3} />
				{/if}
			</div>
			<span class="toggle-label">SUPERIMPOSE OVERLAY</span>
		</button>

		<!-- Toggle 3: Override CSS -->
		<button onclick={() => (useMetricOverrides = !useMetricOverrides)} class="toggle-btn">
			<div class="checkbox-box">
				{#if useMetricOverrides}
					<X size={14} color="#ffffff" strokeWidth={3} />
				{/if}
			</div>
			<span class="toggle-label toggle-label-muted">APPLY OVERRIDE CSS</span>
		</button>
	</div>
</div>

<style>
	.top-left-fixed {
		position: fixed;
		top: 32px;
		left: 32px;
		z-index: 40;
		pointer-events: none;
	}

	.top-right-fixed {
		position: fixed;
		top: 32px;
		right: 32px;
		z-index: 40;
		pointer-events: none;
	}

	.return-btn {
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

	.return-btn:hover {
		transform: scale(1.05);
	}

	.toggles-card {
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		padding: 0 !important;
		font-family: monospace;
		font-size: 12px;
		border: 1.5px solid #dbe8f8;
		min-width: 240px;
		border-radius: 0;
	}

	.toggle-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding-left: 0.5em !important;
		padding-right: 0.5em !important;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		line-height: 2;
		background: transparent;
		border: none;
		color: #ffffff;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.toggle-btn:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.toggle-btn-middle {
		border-top: 1px solid rgba(219, 232, 248, 0.3);
		border-bottom: 1px solid rgba(219, 232, 248, 0.3);
	}

	.checkbox-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		border: 1px solid #dbe8f8;
		background-color: #195782;
		border-radius: 0;
	}

	.toggle-label {
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.toggle-label-muted {
		color: #dbe8f8;
	}
</style>
