<script lang="ts">
	interface GlyphItem {
		char: string;
		pngUrl: string;
		left: number;
		top: number;
		width: number;
		height: number;
		advanceWidth: number;
	}

	interface MinimalRenderData {
		glyphs: GlyphItem[];
		totalAdvanceWidth: number;
	}

	let {
		showOverlay = true,
		useMetricOverrides = false,
		baseRenderData,
		targetRenderData,
		baselineY,
		cjkOffsetEm,
		fontSize
	}: {
		showOverlay: boolean;
		useMetricOverrides: boolean;
		baseRenderData: MinimalRenderData;
		targetRenderData: MinimalRenderData;
		baselineY: number;
		cjkOffsetEm: number;
		fontSize: number;
	} = $props();
</script>

<div class="texture-canvas-wrapper">
	<!-- BASE REFERENCE FONT LAYER (Pastel Red #FF8A80 - STATIONARY BASELINE CONTROL REFERENCE) -->
	{#if showOverlay}
		<div
			class="font-layer-base"
			style="
				width: {baseRenderData.totalAdvanceWidth}px;
				left: calc(50% - {baseRenderData.totalAdvanceWidth / 2}px);
				top: calc(50% + {baselineY}px);
			"
		>
			{#each baseRenderData.glyphs as g, i (g.char + i)}
				<div
					class="glyph-mask mask-base"
					style="
						left: {g.left}px;
						top: {g.top}px;
						width: {g.width}px;
						height: {g.height}px;
						-webkit-mask-image: url('{g.pngUrl}');
						mask-image: url('{g.pngUrl}');
					"
				></div>
			{/each}
		</div>
	{/if}

	<!-- TARGET FONT LAYER (Mint Green #A7FFEB - ALIGNED & DRIFTED EXPERIMENTAL FONT) -->
	<div
		class="font-layer-target"
		style="
			width: {targetRenderData.totalAdvanceWidth}px;
			left: calc(50% - {targetRenderData.totalAdvanceWidth / 2}px);
			top: calc(50% + {useMetricOverrides
			? `${baselineY}px`
			: `${baselineY - cjkOffsetEm * fontSize}px`});
		"
	>
		{#each targetRenderData.glyphs as g, i (g.char + i)}
			<div
				class="glyph-mask mask-target"
				style="
					left: {g.left}px;
					top: {g.top}px;
					width: {g.width}px;
					height: {g.height}px;
					-webkit-mask-image: url('{g.pngUrl}');
					mask-image: url('{g.pngUrl}');
				"
			></div>
		{/each}
	</div>
</div>

<style>
	.texture-canvas-wrapper {
		position: relative;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		isolation: isolate;
	}

	.font-layer-base {
		pointer-events: none;
		position: absolute;
		height: 0px;
		mix-blend-mode: screen;
		user-select: none;
	}

	.font-layer-target {
		pointer-events: none;
		position: absolute;
		height: 0px;
		mix-blend-mode: screen;
		user-select: none;
	}

	.glyph-mask {
		position: absolute;
		pointer-events: none;
		-webkit-mask-size: contain;
		mask-size: contain;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
	}

	.mask-base {
		background-color: #ff8a80;
	}

	.mask-target {
		background-color: #a7ffeb;
	}
</style>
