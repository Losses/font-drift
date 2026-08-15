<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { CustomFont } from '$lib/types';
	import {
		INITIAL_FALLBACKS,
		fallbackToCustomFont,
		DEFAULT_BASE_FONT,
		parseUploadedFont
	} from '$lib/metrics';
	import { getScreenEdgeRatios } from '$lib/utils';

	import BlueprintCanvas from '$lib/components/BlueprintCanvas.svelte';
	import HeaderBar from '$lib/components/HeaderBar.svelte';
	import CornerControls from '$lib/components/CornerControls.svelte';
	import CssExportModal from '$lib/components/CssExportModal.svelte';
	import DropzoneButton from '$lib/components/DropzoneButton.svelte';
	import FontSelectListCard from '$lib/components/FontSelectListCard.svelte';

	const BAKED_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 108, 120];

	// Pre-measured system fonts
	const premeasuredFonts = INITIAL_FALLBACKS.map(fallbackToCustomFont);

	let customFonts = $state<CustomFont[]>([]);
	let allFonts = $derived([...customFonts, ...premeasuredFonts]);

	let baseFont = $state<CustomFont>(DEFAULT_BASE_FONT);

	// Target Font starts as NULL (NO PREVIEW UNTIL LOADED/SELECTED!)
	let targetFont = $state<CustomFont | null>(null);

	// Discrete Font Size (Strictly snaps to BAKED_SIZES steps, no smooth CSS/JS interpolation)
	let fontSize = $state(64);
	let text = $state('放轻松');

	// Display Toggles
	let showBaselines = $state(true);
	let showOverlay = $state(true);
	let useMetricOverrides = $state(false);

	// Modals & Drag State
	let isExportOpen = $state(false);
	let isDraggingFile = $state(false);

	// Mouse Position & Screen Ratios
	let mouseX = $state(0);
	let mouseY = $state(0);
	let winWidth = $state(1920);
	let winHeight = $state(1080);

	function getSlug(family: string) {
		return family
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	// Persistent SvelteMap image memory cache to prevent GC eviction & satisfy ESLint Svelte reactivity
	const globalImageCache = new SvelteMap<string, HTMLImageElement>();

	// Preload all baked PNG images into browser memory cache for instant, zero-flicker rendering
	function preloadAllBakedImages() {
		if (typeof window === 'undefined') return;
		const chars = ['放', '轻', '松'];
		const fontsToPreload = [DEFAULT_BASE_FONT, ...premeasuredFonts];

		fontsToPreload.forEach((font) => {
			const slug = getSlug(font.family);
			BAKED_SIZES.forEach((size) => {
				chars.forEach((char) => {
					const src = `/baked/${slug}/${char}_${size}px.png`;
					if (!globalImageCache.has(src)) {
						const img = new Image();
						img.src = src;
						if (img.decode) {
							img.decode().catch(() => {});
						}
						globalImageCache.set(src, img);
					}
				});
			});
		});
	}

	// Mouse tracking effect with discrete font size snapping
	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;

		// Calculate ratios
		const info = getScreenEdgeRatios(mouseX, mouseY, winWidth, winHeight);

		// Discrete Font Size Stepping (Strictly snaps to closest BAKED_SIZES integer step)
		const rawSize = 12 + info.shortEdgeRatio * (120 - 12);
		const snappedSize = BAKED_SIZES.reduce(
			(prev, curr) => (Math.abs(curr - rawSize) < Math.abs(prev - rawSize) ? curr : prev),
			64
		);
		fontSize = snappedSize;

		// Long Edge -> Font Family Selection (only when target font is selected)
		if (targetFont && allFonts.length > 0) {
			const fontIndex = Math.min(
				allFonts.length - 1,
				Math.floor(info.longEdgeRatio * allFonts.length)
			);
			targetFont = allFonts[fontIndex];
		}
	}

	async function handleFontFiles(files: FileList | File[]) {
		if (!files || files.length === 0) return;

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const ext = file.name.split('.').pop()?.toLowerCase();
				if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
					throw new Error(`Unsupported format: .${ext}`);
				}

				const { font } = await parseUploadedFont(file);
				customFonts = [font, ...customFonts];
				targetFont = font;
			}
		} catch (err: unknown) {
			console.error('Failed to parse uploaded font:', err);
		}
	}

	function onGlobalDrop(e: DragEvent) {
		e.preventDefault();
		isDraggingFile = false;
		if (e.dataTransfer?.files) {
			handleFontFiles(e.dataTransfer.files);
		}
	}

	function onFileInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			handleFontFiles(input.files);
		}
	}

	// Trigger image preloading immediately upon script execution on client side
	if (typeof window !== 'undefined') {
		preloadAllBakedImages();
	}

	onMount(() => {
		winWidth = window.innerWidth;
		winHeight = window.innerHeight;
		mouseX = Math.round(winWidth / 2);
		mouseY = Math.round(winHeight / 2);

		preloadAllBakedImages();

		const handleResize = () => {
			winWidth = window.innerWidth;
			winHeight = window.innerHeight;
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<div
	onmousemove={handleMouseMove}
	ondragover={(e) => {
		e.preventDefault();
		isDraggingFile = true;
	}}
	ondragleave={() => (isDraggingFile = false)}
	ondrop={onGlobalDrop}
	role="region"
	aria-label="Font Drift Workspace"
	class="page-container"
>
	<!-- Blueprint Grid Background -->
	<div class="blueprint-paper-bg"></div>

	{#if targetFont}
		<!-- ACTIVE STATE: FONT LOADED & VISUALIZING -->
		<HeaderBar
			bind:showBaselines
			bind:showOverlay
			bind:useMetricOverrides
			onReturnToSelection={() => (targetFont = null)}
		/>

		<!-- Main Visualizer Area -->
		<main class="main-visualizer">
			<BlueprintCanvas
				bind:targetFont
				bind:baseFont
				{fontSize}
				{text}
				{showBaselines}
				{showOverlay}
				{useMetricOverrides}
			/>
		</main>

		<!-- Corner Floating Action Buttons -->
		<CornerControls onOpenExport={() => (isExportOpen = true)} />

		<!-- Single Essential All-Fonts CSS Export Modal -->
		<CssExportModal bind:isOpen={isExportOpen} {baseFont} {customFonts} />
	{:else}
		<!-- INITIAL STATE: LEFT-RIGHT FONT SELECTION INTERFACE -->
		<div class="landing-wrapper">
			<div class="landing-grid">
				<!-- LEFT SIDE: UPLOAD BUTTON COMPONENT -->
				<DropzoneButton {isDraggingFile} {onFileInputChange} />

				<!-- RIGHT SIDE: FONT LIST CARD COMPONENT -->
				<FontSelectListCard fonts={premeasuredFonts} onSelectFont={(font) => (targetFont = font)} />
			</div>
		</div>
	{/if}
</div>

<style>
	.main-visualizer {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.landing-wrapper {
		position: relative;
		z-index: 30;
		display: flex;
		height: 100%;
		width: 100%;
		align-items: center;
		justify-content: center;
	}

	.landing-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		width: 100%;
		max-width: 840px;
		align-items: center;
		justify-items: center;
	}

	@media (max-width: 768px) {
		.landing-grid {
			grid-template-columns: 1fr;
			gap: 24px;
		}
	}
</style>
