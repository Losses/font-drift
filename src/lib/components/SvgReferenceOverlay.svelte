<script lang="ts">
	let {
		xAscenderLeft,
		xAscenderRight,
		xCapHeightLeft,
		xCapHeightRight,
		xOpticalLeft,
		xOpticalRight,
		xBaselineLeft,
		xBaselineRight,
		xDescenderLeft,
		xDescenderRight,
		yAscender,
		yCapHeight,
		yOptical,
		yBaseline,
		yDescender,
		leaderAscender,
		leaderCapHeight,
		leaderOptical,
		leaderBaseline,
		leaderDescender,
		showLeaders = true
	}: {
		xAscenderLeft: number;
		xAscenderRight: number;
		xCapHeightLeft: number;
		xCapHeightRight: number;
		xOpticalLeft: number;
		xOpticalRight: number;
		xBaselineLeft: number;
		xBaselineRight: number;
		xDescenderLeft: number;
		xDescenderRight: number;
		yAscender: number;
		yCapHeight: number;
		yOptical: number;
		yBaseline: number;
		yDescender: number;
		leaderAscender: string;
		leaderCapHeight: string;
		leaderOptical: string;
		leaderBaseline: string;
		leaderDescender: string;
		showLeaders?: boolean;
	} = $props();
</script>

<svg class="svg-overlay">
	<!-- 1. LINES INSIDE CAPSULE (STOPS AT EXACT ROUNDED ARC INTERSECTION POINTS - ZERO OVERFLOW) -->
	<line
		x1={xAscenderLeft}
		y1={yAscender}
		x2={xAscenderRight}
		y2={yAscender}
		stroke="#bdd4f1"
		stroke-width="1.2"
		stroke-dasharray="4 4"
		opacity="0.65"
	/>
	<line
		x1={xCapHeightLeft}
		y1={yCapHeight}
		x2={xCapHeightRight}
		y2={yCapHeight}
		stroke="#dbe8f8"
		stroke-width="1.5"
		stroke-dasharray="8 4"
		opacity="0.85"
	/>
	<line
		x1={xOpticalLeft}
		y1={yOptical}
		x2={xOpticalRight}
		y2={yOptical}
		stroke="#dbe8f8"
		stroke-width="1"
		stroke-dasharray="2 4"
		opacity="0.4"
	/>
	<line
		x1={xBaselineLeft}
		y1={yBaseline}
		x2={xBaselineRight}
		y2={yBaseline}
		stroke="#ffffff"
		stroke-width="2"
		opacity="1.0"
	/>
	<line
		x1={xDescenderLeft}
		y1={yDescender}
		x2={xDescenderRight}
		y2={yDescender}
		stroke="#bdd4f1"
		stroke-width="1.2"
		stroke-dasharray="4 4"
		opacity="0.65"
	/>

	<!-- 2. LEADER LINES OUTSIDE CAPSULE (CONNECTS DIRECTLY TO EXACT CARD OUTER BORDER) -->
	{#if showLeaders}
		<path d={leaderBaseline} fill="none" stroke="#ffffff" stroke-width="2" opacity="1.0" />
		<path
			d={leaderCapHeight}
			fill="none"
			stroke="#dbe8f8"
			stroke-width="1.5"
			stroke-dasharray="8 4"
			opacity="0.85"
		/>
		<path
			d={leaderAscender}
			fill="none"
			stroke="#bdd4f1"
			stroke-width="1.2"
			stroke-dasharray="4 4"
			opacity="0.65"
		/>
		<path
			d={leaderDescender}
			fill="none"
			stroke="#bdd4f1"
			stroke-width="1.2"
			stroke-dasharray="4 4"
			opacity="0.65"
		/>
		<path
			d={leaderOptical}
			fill="none"
			stroke="#dbe8f8"
			stroke-width="1"
			stroke-dasharray="2 4"
			opacity="0.4"
		/>
	{/if}
</svg>

<style>
	.svg-overlay {
		pointer-events: none;
		position: absolute;
		inset: 0;
		z-index: 25;
		height: 100%;
		width: 100%;
		overflow: visible;
	}
</style>
