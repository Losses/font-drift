import JSZip from 'jszip';
import type { BakedCharMetrics, BakedResultSet, CustomFont } from './types';

export const BAKE_TEXT = '放轻松';
export const STANDARD_BAKE_SIZES = [
	12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 108, 120
];

/**
 * Bakes a single character at a given font size into a transparent canvas,
 * measures pixel bounding box and TextMetrics parameters, and returns PNG data URL + metrics.
 */
export function bakeCharacter(
	char: string,
	fontSize: number,
	fontFamily: string
): BakedCharMetrics {
	if (typeof document === 'undefined') {
		return {
			char,
			fontSize,
			fontFamily,
			advanceWidth: fontSize,
			fontBoundingBoxAscent: fontSize * 0.8,
			fontBoundingBoxDescent: fontSize * 0.2,
			actualBoundingBoxAscent: fontSize * 0.7,
			actualBoundingBoxDescent: fontSize * 0.1,
			actualBoundingBoxLeft: 0,
			actualBoundingBoxRight: fontSize,
			pixelBox: { x: 0, y: 0, width: fontSize, height: fontSize },
			dataUrl: ''
		};
	}

	const padding = Math.max(16, Math.ceil(fontSize * 0.4));
	const canvasWidth = Math.ceil(fontSize * 2 + padding * 2);
	const canvasHeight = Math.ceil(fontSize * 2 + padding * 2);

	const canvas = document.createElement('canvas');
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });

	if (!ctx) {
		throw new Error('Failed to get 2D context for canvas baking');
	}

	// Transparent background
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;
	ctx.textBaseline = 'alphabetic';
	ctx.fillStyle = '#ffffff';

	const metrics = ctx.measureText(char);

	// Baseline position inside canvas
	const baselineX = Math.round(canvasWidth / 2 - metrics.width / 2);
	const baselineY = Math.round(canvasHeight / 2 + fontSize * 0.3);

	// Draw crisp white text
	ctx.fillText(char, baselineX, baselineY);

	// Scan image pixel data to get exact pixel bounding box
	const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	const data = imgData.data;

	let minX = canvasWidth;
	let minY = canvasHeight;
	let maxX = -1;
	let maxY = -1;

	for (let y = 0; y < canvasHeight; y++) {
		for (let x = 0; x < canvasWidth; x++) {
			const alpha = data[(y * canvasWidth + x) * 4 + 3];
			if (alpha > 5) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}

	const pixelWidth = maxX >= minX ? maxX - minX + 1 : 0;
	const pixelHeight = maxY >= minY ? maxY - minY + 1 : 0;

	return {
		char,
		fontSize,
		fontFamily,
		advanceWidth: metrics.width,
		fontBoundingBoxAscent: metrics.fontBoundingBoxAscent || fontSize * 0.85,
		fontBoundingBoxDescent: metrics.fontBoundingBoxDescent || fontSize * 0.15,
		actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || fontSize * 0.7,
		actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || fontSize * 0.1,
		actualBoundingBoxLeft: metrics.actualBoundingBoxLeft || 0,
		actualBoundingBoxRight: metrics.actualBoundingBoxRight || metrics.width,
		pixelBox: {
			x: minX,
			y: minY,
			width: pixelWidth,
			height: pixelHeight
		},
		dataUrl: canvas.toDataURL('image/png')
	};
}

/**
 * Bakes "放轻松" for all sizes from 12px to 120px for the given font
 */
export async function bakeFontSet(
	font: CustomFont,
	sizes: number[] = STANDARD_BAKE_SIZES,
	text: string = BAKE_TEXT,
	onProgress?: (percent: number, currentLabel: string) => void
): Promise<BakedResultSet> {
	if (typeof document !== 'undefined' && document.fonts) {
		try {
			await document.fonts.load(`100px "${font.family}"`);
			await document.fonts.ready;
		} catch (e) {
			console.warn(`Font load check warning for ${font.family}:`, e);
		}
	}

	const chars = text.split('');
	const totalSteps = sizes.length * chars.length;
	let currentStep = 0;
	const results: BakedCharMetrics[] = [];

	for (let sIdx = 0; sIdx < sizes.length; sIdx++) {
		const size = sizes[sIdx];
		for (let cIdx = 0; cIdx < chars.length; cIdx++) {
			const char = chars[cIdx];
			currentStep++;
			if (onProgress) {
				onProgress(Math.round((currentStep / totalSteps) * 100), `Baking '${char}' @ ${size}px...`);
			}

			// Yield event loop for UI updates
			await new Promise((r) => setTimeout(r, 0));

			const baked = bakeCharacter(char, size, font.family);
			results.push(baked);
		}
	}

	return {
		fontFamily: font.family,
		text,
		sizes,
		metrics: results,
		timestamp: new Date().toISOString()
	};
}

/**
 * Creates a single combined Canvas Sprite Atlas containing all baked character frames
 */
export function createBakedAtlasCanvas(resultSet: BakedResultSet): HTMLCanvasElement {
	if (typeof document === 'undefined') {
		throw new Error('Atlas canvas requires DOM environment');
	}

	const padding = 12;
	const itemWidth = 140;
	const itemHeight = 160;

	const cols = resultSet.sizes.length;
	const rows = resultSet.text.length;

	const atlasWidth = cols * itemWidth + padding * 2;
	const atlasHeight = rows * itemHeight + padding * 2 + 40;

	const canvas = document.createElement('canvas');
	canvas.width = atlasWidth;
	canvas.height = atlasHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) return canvas;

	// Dark blueprint background for atlas preview
	ctx.fillStyle = '#060b19';
	ctx.fillRect(0, 0, atlasWidth, atlasHeight);

	// Grid lines
	ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
	ctx.lineWidth = 1;
	for (let x = 0; x < atlasWidth; x += 20) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, atlasHeight);
		ctx.stroke();
	}
	for (let y = 0; y < atlasHeight; y += 20) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(atlasWidth, y);
		ctx.stroke();
	}

	// Title
	ctx.fillStyle = '#00f0ff';
	ctx.font = 'bold 14px monospace';
	ctx.fillText(
		`FONT DRIFT BAKED ATLAS - ${resultSet.fontFamily} - "${resultSet.text}" (12px to 120px)`,
		padding,
		25
	);

	const chars = resultSet.text.split('');

	for (let r = 0; r < rows; r++) {
		const char = chars[r];
		for (let c = 0; c < cols; c++) {
			const size = resultSet.sizes[c];
			const metric = resultSet.metrics.find((m) => m.char === char && m.fontSize === size);

			if (!metric) continue;

			const x = padding + c * itemWidth;
			const y = padding + 40 + r * itemHeight;

			// Cell frame border
			ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
			ctx.strokeRect(x, y, itemWidth - 4, itemHeight - 4);

			// Render baked image
			const img = new Image();
			img.src = metric.dataUrl;

			// Draw image centered in frame
			const destX = x + (itemWidth - 4) / 2 - img.width / 2;
			const destY = y + (itemHeight - 4) / 2 - img.height / 2;
			ctx.drawImage(img, destX, destY);

			// Cell label
			ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
			ctx.font = '10px monospace';
			ctx.fillText(`'${char}' ${size}px`, x + 6, y + 16);
			ctx.fillText(`w:${metric.advanceWidth.toFixed(0)}px`, x + 6, y + itemHeight - 12);
		}
	}

	return canvas;
}

/**
 * Downloads a ZIP package containing all baked PNG frames + metrics JSON + Atlas PNG
 */
export async function downloadBakeZipPackage(resultSet: BakedResultSet): Promise<void> {
	const zip = new JSZip();

	const slug = resultSet.fontFamily.toLowerCase().replace(/[^a-z0-9]+/g, '-');
	const folder = zip.folder(`baked-${slug}-12to120px`);

	if (!folder) return;

	// Add JSON manifest
	folder.file('metrics-manifest.json', JSON.stringify(resultSet, null, 2));

	// Add individual PNG frames
	for (const m of resultSet.metrics) {
		const base64Data = m.dataUrl.replace(/^data:image\/png;base64,/, '');
		const fileName = `frames/${m.char}_${m.fontSize}px.png`;
		folder.file(fileName, base64Data, { base64: true });
	}

	// Add combined Atlas PNG
	const atlasCanvas = createBakedAtlasCanvas(resultSet);
	const atlasBase64 = atlasCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
	folder.file('atlas.png', atlasBase64, { base64: true });

	// Generate zip blob & trigger download
	const content = await zip.generateAsync({ type: 'blob' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(content);
	link.download = `font-drift-${slug}-baked.zip`;
	link.click();
	URL.revokeObjectURL(link.href);
}
