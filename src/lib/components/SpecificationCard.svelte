<script lang="ts">
	import type { CustomFont, GeneratedCssResult } from '$lib/types';

	let {
		targetFont,
		baseFont,
		fontSize,
		alignmentCss,
		isNarrowScreen = false,
		ascenderVal = '',
		capHeightVal = '',
		opticalVal = '',
		baselineVal = '',
		descenderVal = ''
	}: {
		targetFont: CustomFont;
		baseFont: CustomFont;
		fontSize: number;
		alignmentCss: GeneratedCssResult;
		isNarrowScreen?: boolean;
		ascenderVal?: string;
		capHeightVal?: string;
		opticalVal?: string;
		baselineVal?: string;
		descenderVal?: string;
	} = $props();
</script>

<div class="spec-card-fixed font-mono">
	<div class="blueprint-card spec-card-box">
		<div class="card-row-item spec-header">
			<span class="spec-title">SPECIFICATION</span>
		</div>
		<div class="spec-body">
			<div class="card-row-item spec-row">
				<span class="text-label-muted">TARGET</span>
				<span class="spec-value color-target-font">{targetFont.family}</span>
			</div>
			<div class="card-row-item spec-row">
				<span class="text-label-muted">BASE</span>
				<span class="spec-value color-base-font">{baseFont.family}</span>
			</div>
			<div class="card-row-item spec-row spec-row-divider">
				<span class="text-label">SIZE-ADJUST</span>
				<span class="spec-value text-label">{(alignmentCss.sizeAdjust * 100).toFixed(2)}%</span>
			</div>
			<div class="card-row-item spec-row">
				<span class="text-label">TONSKY SHIFT</span>
				<span class="spec-value text-label"
					>{(alignmentCss.cjkOffsetEm * fontSize).toFixed(1)}px</span
				>
			</div>

			<!-- MERGED CALLOUT METRICS FOR NARROW SCREENS (AUTOMATICALLY ACTIVATED WHEN SCREEN IS NARROW) -->
			{#if isNarrowScreen}
				<div class="card-row-item spec-row spec-row-divider">
					<span class="text-label-muted">ASCENDER</span>
					<span class="spec-value text-label">{ascenderVal}</span>
				</div>
				<div class="card-row-item spec-row">
					<span class="text-label-muted">CAP HEIGHT</span>
					<span class="spec-value text-label">{capHeightVal}</span>
				</div>
				<div class="card-row-item spec-row">
					<span class="text-label-muted">OPTICAL CENTER</span>
					<span class="spec-value text-label">{opticalVal}</span>
				</div>
				<div class="card-row-item spec-row">
					<span class="text-label-muted">BASELINE</span>
					<span class="spec-value text-label">{baselineVal}</span>
				</div>
				<div class="card-row-item spec-row">
					<span class="text-label-muted">DESCENDER</span>
					<span class="spec-value text-label">{descenderVal}</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.spec-card-fixed {
		pointer-events: none;
		position: absolute;
		bottom: 32px;
		right: 32px;
		z-index: 30;
		display: flex;
		flex-direction: column;
		font-size: 11px;
	}

	.spec-card-box {
		display: flex;
		flex-direction: column;
		padding: 0 !important;
		font-size: 11px;
		min-width: 280px;
		border-radius: 0 !important;
		border: 1.5px solid #dbe8f8;
	}

	.card-row-item {
		padding-left: 0.5em !important;
		padding-right: 0.5em !important;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}

	.spec-header {
		width: 100%;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		border-bottom: 1px solid #dbe8f8;
		line-height: 2;
	}

	.spec-title {
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		font-size: 11px;
	}

	.spec-body {
		width: 100%;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		display: flex;
		flex-direction: column;
		gap: 0;
		color: #dbe8f8;
	}

	.spec-row {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		line-height: 2;
	}

	.spec-row-divider {
		border-top: 1px solid rgba(219, 232, 248, 0.4);
		padding-top: 0 !important;
		margin-top: 0 !important;
	}

	.text-label-muted {
		color: #bdd4f1;
		font-size: 11px;
	}

	.text-label {
		color: #ffffff;
		font-size: 11px;
	}

	.spec-value {
		font-size: 11px !important;
		font-weight: 700;
	}

	.color-target-font {
		color: #a7ffeb;
	}

	.color-base-font {
		color: #ff8a80;
	}
</style>
