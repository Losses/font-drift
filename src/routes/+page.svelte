<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { CustomFont, BakedCharMetrics } from '$lib/types';
	import { INITIAL_FALLBACKS, fallbackToCustomFont, parseUploadedFont } from '$lib/metrics';
	import { bakeFontSet } from '$lib/baker';
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

	let masterManifest = $state<Record<string, BakedCharMetrics[]>>({});

	// Base Font is the user's chosen standard webfont; Target Font is the fallback font candidate
	let baseFont = $state<CustomFont | null>(null);
	let targetFont = $state<CustomFont | null>(null);

	let fallbackFonts = $derived.by(() => {
		const currentBase = baseFont;
		return currentBase ? allFonts.filter((f) => f.id !== currentBase.id) : premeasuredFonts;
	});

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
		const raw = family
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
		if (raw === 'pingfang-sc') return 'pingfang-sc-regular';
		if (raw === 'opposans') return 'opposans-r';
		if (raw === 'vivo-sans') return 'vivo-sans-global';
		return raw;
	}

	// Persistent SvelteMap image memory cache to prevent GC eviction & satisfy ESLint Svelte reactivity
	const globalImageCache = new SvelteMap<string, HTMLImageElement>();

	// Preload all baked PNG images into browser memory cache for instant, zero-flicker rendering
	function preloadAllBakedImages() {
		if (typeof window === 'undefined') return;
		const chars = ['放', '轻', '松'];
		const fontsToPreload = premeasuredFonts;

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

	// Mouse tracking effect: Y-axis steps font size, X-axis slides target fallback font
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

		// Long Edge -> Slide TARGET fallback font across fallbackFonts while BASE remains fixed
		if (baseFont && fallbackFonts.length > 0) {
			const fontIndex = Math.min(
				fallbackFonts.length - 1,
				Math.floor(info.longEdgeRatio * fallbackFonts.length)
			);
			targetFont = fallbackFonts[fontIndex];
		}
	}

	function selectBaseFont(font: CustomFont) {
		baseFont = font;
		const fallbacks = allFonts.filter((f) => f.id !== font.id);
		targetFont = fallbacks[0] || premeasuredFonts[0];
	}

	function deleteCustomFont(fontToDelete: CustomFont) {
		if (fontToDelete.url) {
			URL.revokeObjectURL(fontToDelete.url);
		}
		if (fontToDelete.family && masterManifest[fontToDelete.family]) {
			delete masterManifest[fontToDelete.family];
		}
		customFonts = customFonts.filter((f) => f.id !== fontToDelete.id);
		if (baseFont?.id === fontToDelete.id) {
			baseFont = null;
			targetFont = null;
		}
	}

	function handleReturnToSelection() {
		customFonts.forEach((font) => {
			if (font.url) {
				URL.revokeObjectURL(font.url);
			}
			if (font.family && masterManifest[font.family]) {
				delete masterManifest[font.family];
			}
		});
		customFonts = [];
		baseFont = null;
		targetFont = null;
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
				const bakedSet = await bakeFontSet(font, BAKED_SIZES, text);
				masterManifest[font.family] = bakedSet.metrics.map((m) => ({
					fontFamily: m.fontFamily,
					char: m.char,
					fontSize: m.fontSize,
					advanceWidth: m.advanceWidth,
					fontBoundingBoxAscent: m.fontBoundingBoxAscent,
					fontBoundingBoxDescent: m.fontBoundingBoxDescent,
					actualBoundingBoxAscent: m.actualBoundingBoxAscent,
					actualBoundingBoxDescent: m.actualBoundingBoxDescent,
					actualBoundingBoxLeft: m.actualBoundingBoxLeft,
					actualBoundingBoxRight: m.actualBoundingBoxRight,
					pixelBox: m.pixelBox,
					dataUrl: m.dataUrl
				}));
				customFonts = [font, ...customFonts];
				baseFont = font;
				const fallbacks = allFonts.filter((f) => f.id !== font.id);
				targetFont = fallbacks[0] || premeasuredFonts[0];
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

	{#if baseFont && targetFont}
		<!-- ACTIVE STATE: FONT LOADED & VISUALIZING -->
		<HeaderBar
			bind:showBaselines
			bind:showOverlay
			bind:useMetricOverrides
			onReturnToSelection={handleReturnToSelection}
		/>

		<!-- Main Visualizer Area -->
		<main class="main-visualizer">
			<BlueprintCanvas
				bind:targetFont
				bind:baseFont
				bind:masterManifest
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
				<FontSelectListCard
					fonts={allFonts}
					onSelectFont={selectBaseFont}
					onDeleteFont={deleteCustomFont}
				/>
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
