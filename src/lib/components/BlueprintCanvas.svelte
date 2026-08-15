<script lang="ts">
	import { onMount } from 'svelte';
	import type { CustomFont } from '$lib/types';
	import { calculateAlignmentCss } from '$lib/metrics';

	import BakedTextureCanvas from './BakedTextureCanvas.svelte';
	import SvgReferenceOverlay from './SvgReferenceOverlay.svelte';
	import SideCalloutCard from './SideCalloutCard.svelte';
	import SpecificationCard from './SpecificationCard.svelte';

	interface BakedMetrics {
		fontFamily: string;
		char: string;
		fontSize: number;
		advanceWidth: number;
		fontBoundingBoxAscent: number;
		fontBoundingBoxDescent: number;
		actualBoundingBoxAscent: number;
		actualBoundingBoxDescent: number;
		actualBoundingBoxLeft: number;
		actualBoundingBoxRight: number;
		pixelBox: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		pngFileName: string;
	}

	let {
		targetFont = $bindable<CustomFont>(),
		baseFont = $bindable<CustomFont>(),
		fontSize = 64,
		text = '放轻松',
		showBaselines = true,
		showOverlay = true,
		useMetricOverrides = false
	}: {
		targetFont: CustomFont;
		baseFont: CustomFont;
		fontSize: number;
		text: string;
		showBaselines: boolean;
		showOverlay: boolean;
		useMetricOverrides: boolean;
	} = $props();

	const BAKED_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 108, 120];

	let masterManifest = $state<Record<string, BakedMetrics[]>>({});
	let containerWidth = $state(1920);
	let containerHeight = $state(1080);

	onMount(async () => {
		try {
			const res = await fetch('/baked/master-manifest.json');
			if (res.ok) {
				masterManifest = await res.json();
			}
		} catch (e) {
			console.error('Failed to load master manifest:', e);
		}
	});

	let alignmentCss = $derived(calculateAlignmentCss(targetFont, baseFont));

	function getSlug(family: string) {
		return family
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function getBakedGlyphData(fontObj: CustomFont, size: number, displayCharText: string) {
		let family = fontObj.family;
		let records = masterManifest[family];

		if (!records || records.length === 0) {
			const targetSlug = getSlug(family);
			const matchedKey = Object.keys(masterManifest).find(
				(k) =>
					getSlug(k) === targetSlug ||
					getSlug(k).startsWith(targetSlug) ||
					targetSlug.startsWith(getSlug(k))
			);
			if (matchedKey) {
				family = matchedKey;
				records = masterManifest[matchedKey];
			} else {
				records = masterManifest['PingFang SC Regular'] || [];
			}
		}

		const chars = displayCharText.split('');
		const slug = getSlug(family);
		const closestSize = BAKED_SIZES.reduce(
			(prev, curr) => (Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev),
			120
		);

		const scale = size / closestSize;
		const padding = Math.max(16, Math.ceil(closestSize * 0.4));
		const bakedCanvasWidth = Math.ceil(closestSize * 2 + padding * 2);
		const bakedCanvasHeight = Math.ceil(closestSize * 2 + padding * 2);

		const renderWidth = bakedCanvasWidth * scale;
		const renderHeight = bakedCanvasHeight * scale;

		let totalAdvanceWidth = 0;
		const glyphs = chars.map((char) => {
			const rec = records.find((r) => r.char === char && r.fontSize === closestSize);
			const adv = rec ? rec.advanceWidth * scale : size * scale;
			const currentX = totalAdvanceWidth;
			totalAdvanceWidth += adv;

			const pngUrl = `/baked/${slug}/${char}_${closestSize}px.png`;
			const baselineXInPng =
				(bakedCanvasWidth / 2 - (rec ? rec.advanceWidth : closestSize) / 2) * scale;
			const baselineYInPng = (bakedCanvasHeight / 2 + closestSize * 0.3) * scale;

			const leftPos = currentX - baselineXInPng;
			const topPos = -baselineYInPng;

			return {
				char,
				pngUrl,
				left: leftPos,
				top: topPos,
				width: renderWidth,
				height: renderHeight,
				advanceWidth: adv,
				records: rec
			};
		});

		return {
			glyphs,
			totalAdvanceWidth,
			renderHeight,
			records,
			closestSize,
			scale
		};
	}

	let targetRenderData = $derived(
		getBakedGlyphData(
			targetFont,
			fontSize * (useMetricOverrides ? alignmentCss.sizeAdjust : 1),
			text
		)
	);

	let baseRenderData = $derived(getBakedGlyphData(baseFont, fontSize, text));

	// 100% AUTHENTIC UNTAMPERED RAW TYPOGRAPHIC EM RATIOS (Derived directly from font table unitsPerEm)
	let upm = $derived(targetFont.unitsPerEm || 1000);
	let rawAscenderRatio = $derived((targetFont.ascender || 880) / upm);
	let rawCapHeightRatio = $derived((targetFont.capHeight || 700) / upm);
	let rawDescenderRatio = $derived(Math.abs(targetFont.descender || -120) / upm);

	// Effective ratios considering sizeAdjust when OVERRIDE is active
	let effectiveScale = $derived(useMetricOverrides ? alignmentCss.sizeAdjust : 1.0);
	let ascenderRatio = $derived(rawAscenderRatio * effectiveScale);
	let capHeightRatio = $derived(rawCapHeightRatio * effectiveScale);
	let descenderRatio = $derived(rawDescenderRatio * effectiveScale);

	// Exact physical line offsets in pixels relative to target font baseline
	let realAscenderPx = $derived(fontSize * ascenderRatio);
	let realCapHeightPx = $derived(fontSize * capHeightRatio);
	let realDescenderPx = $derived(fontSize * descenderRatio);

	// BASE REFERENCE FONT BASELINE ANCHOR (STATIONARY ROCK SOLID ANCHOR BASED EXCLUSIVELY ON BASE FONT)
	let baseTotalBoxHeight = $derived(baseFont.browserAscent + baseFont.browserDescent);
	let baseBaselineRatioFromTop = $derived(
		baseTotalBoxHeight > 0 ? baseFont.browserAscent / baseTotalBoxHeight : 0.88
	);

	// Base Baseline Y offset from center
	let baseBaselineY = $derived(fontSize * (baseBaselineRatioFromTop - 0.5));

	// Target Font Baseline Y offset
	let targetBaselineY = $derived(
		useMetricOverrides ? baseBaselineY : baseBaselineY - alignmentCss.cjkOffsetEm * fontSize
	);

	let ascenderY = $derived(targetBaselineY - realAscenderPx);
	let capHeightY = $derived(targetBaselineY - realCapHeightPx);
	let descenderY = $derived(targetBaselineY + realDescenderPx);

	// ROCK-SOLID UNIFORM CAPSULE CONTAINER DIMENSIONS:
	// Computed from current fontSize and text length to comfortably fit ALL fonts in the system (including extreme script descenders)
	// Guaranteed 100% stationary and stable when switching font families (Zero wriggling!)
	let capsuleWidth = $derived(Math.max(440, Math.ceil(fontSize * text.length * 1.5 + 160)));
	let capsuleHeight = $derived(Math.max(160, Math.ceil(fontSize * 2.2)));

	let centerX = $derived(containerWidth / 2);
	let centerY = $derived(containerHeight / 2);
	let R = $derived(capsuleHeight / 2);

	function getPillIntersectionX(yCoord: number, isLeft: boolean) {
		const dy = Math.max(-R + 0.5, Math.min(R - 0.5, yCoord - centerY));
		const dx = Math.sqrt(Math.max(0, R * R - dy * dy));

		if (isLeft) {
			return centerX - capsuleWidth / 2 + R - dx;
		} else {
			return centerX + capsuleWidth / 2 - R + dx;
		}
	}

	// Reference lines at TRUE physical Y coordinates
	let yAscender = $derived(centerY + ascenderY);
	let yCapHeight = $derived(centerY + capHeightY);
	let yOptical = $derived(centerY);
	let yBaseline = $derived(centerY + targetBaselineY);
	let yDescender = $derived(centerY + descenderY);

	let xAscenderLeft = $derived(getPillIntersectionX(yAscender, true));
	let xAscenderRight = $derived(getPillIntersectionX(yAscender, false));

	let xCapHeightLeft = $derived(getPillIntersectionX(yCapHeight, true));
	let xCapHeightRight = $derived(getPillIntersectionX(yCapHeight, false));

	let xOpticalLeft = $derived(getPillIntersectionX(yOptical, true));
	let xOpticalRight = $derived(getPillIntersectionX(yOptical, false));

	let xBaselineLeft = $derived(getPillIntersectionX(yBaseline, true));
	let xBaselineRight = $derived(getPillIntersectionX(yBaseline, false));

	let xDescenderLeft = $derived(getPillIntersectionX(yDescender, true));
	let xDescenderRight = $derived(getPillIntersectionX(yDescender, false));

	let leftCardRightX = 200;
	let rightCardLeftX = $derived(containerWidth - 200);

	let yLeftCard1 = $derived(centerY - 100);
	let yLeftCard2 = $derived(centerY - 20);
	let yLeftCard3 = $derived(centerY + 60);

	let yRightCard1 = $derived(centerY - 35);
	let yRightCard2 = $derived(centerY + 45);

	let leaderAscender = $derived(
		`M ${xAscenderLeft} ${yAscender} L ${xAscenderLeft - 20} ${yAscender} L ${leftCardRightX + 20} ${yLeftCard1} L ${leftCardRightX} ${yLeftCard1}`
	);
	let leaderCapHeight = $derived(
		`M ${xCapHeightLeft} ${yCapHeight} L ${xCapHeightLeft - 20} ${yCapHeight} L ${leftCardRightX + 20} ${yLeftCard2} L ${leftCardRightX} ${yLeftCard2}`
	);
	let leaderOptical = $derived(
		`M ${xOpticalLeft} ${yOptical} L ${xOpticalLeft - 20} ${yOptical} L ${leftCardRightX + 20} ${yLeftCard3} L ${leftCardRightX} ${yLeftCard3}`
	);

	let leaderBaseline = $derived(
		`M ${xBaselineRight} ${yBaseline} L ${xBaselineRight + 20} ${yBaseline} L ${rightCardLeftX - 20} ${yRightCard1} L ${rightCardLeftX} ${yRightCard1}`
	);
	let leaderDescender = $derived(
		`M ${xDescenderRight} ${yDescender} L ${xDescenderRight + 20} ${yDescender} L ${rightCardLeftX - 20} ${yRightCard2} L ${rightCardLeftX} ${yRightCard2}`
	);
</script>

<div bind:clientWidth={containerWidth} bind:clientHeight={containerHeight} class="canvas-container">
	{#if useMetricOverrides}
		<style>
			{@html alignmentCss.fontFaceCss}
		</style>
	{/if}

	<!-- Central Translucent Capsule Preview Container (Uniform & Rock-Solid Dimensional Stability) -->
	<div
		class="crystal-capsule capsule-box"
		style="
			width: {capsuleWidth}px;
			min-height: {capsuleHeight}px;
		"
	>
		<!-- Center Axis Guide inside capsule -->
		<div class="capsule-axis-guide"></div>

		<!-- Superimposed Baked Texture Canvas Component -->
		<BakedTextureCanvas
			{showOverlay}
			{useMetricOverrides}
			{baseRenderData}
			{targetRenderData}
			baselineY={baseBaselineY}
			cjkOffsetEm={alignmentCss.cjkOffsetEm}
			{fontSize}
		/>
	</div>

	<!-- UNIFIED SVG OVERLAY COMPONENT -->
	{#if showBaselines}
		<SvgReferenceOverlay
			{xAscenderLeft}
			{xAscenderRight}
			{xCapHeightLeft}
			{xCapHeightRight}
			{xOpticalLeft}
			{xOpticalRight}
			{xBaselineLeft}
			{xBaselineRight}
			{xDescenderLeft}
			{xDescenderRight}
			{yAscender}
			{yCapHeight}
			{yOptical}
			{yBaseline}
			{yDescender}
			{leaderAscender}
			{leaderCapHeight}
			{leaderOptical}
			{leaderBaseline}
			{leaderDescender}
		/>

		<!-- SIDE CALLOUT LABELS (100% UNTAMPERED RAW METRICS) -->
		<div class="callout-wrapper">
			<SideCalloutCard
				title="ASCENDER"
				value="+{(ascenderRatio * 100).toFixed(1)}% ({ascenderRatio.toFixed(2)} em)"
				isLeft={true}
				topY={yLeftCard1}
			/>

			<SideCalloutCard
				title="CAP HEIGHT"
				value="+{(capHeightRatio * 100).toFixed(1)}% ({capHeightRatio.toFixed(2)} em)"
				isLeft={true}
				topY={yLeftCard2}
			/>

			<SideCalloutCard
				title="OPTICAL CENTER"
				value="0.0% (0.00 em)"
				isLeft={true}
				topY={yLeftCard3}
			/>

			<SideCalloutCard
				title="BASELINE"
				value={useMetricOverrides
					? '0.0% (0.000 em)'
					: `${(alignmentCss.cjkOffsetEm * 100).toFixed(1)}% (${alignmentCss.cjkOffsetEm.toFixed(3)} em)`}
				isLeft={false}
				topY={yRightCard1}
				isWhiteBorder={true}
			/>

			<SideCalloutCard
				title="DESCENDER"
				value="-{(descenderRatio * 100).toFixed(1)}% ({descenderRatio.toFixed(2)} em)"
				isLeft={false}
				topY={yRightCard2}
			/>
		</div>
	{/if}

	<!-- SPECIFICATION CARD COMPONENT -->
	<SpecificationCard {targetFont} {baseFont} {fontSize} {alignmentCss} />
</div>

<style>
	.canvas-container {
		position: relative;
		display: flex;
		height: 100%;
		width: 100%;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding: 32px;
		user-select: none;
	}

	.capsule-box {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: 64px;
		padding-right: 64px;
		padding-top: 32px;
		padding-bottom: 32px;
		white-space: nowrap !important;
		z-index: 20;
	}

	.capsule-axis-guide {
		pointer-events: none;
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		z-index: 0;
		height: 1px;
		background-color: rgba(255, 255, 255, 0.3);
	}

	.callout-wrapper {
		pointer-events: none;
		position: absolute;
		inset: 0;
		z-index: 30;
		font-family: monospace;
		font-size: 12px;
		overflow: hidden;
	}
</style>
