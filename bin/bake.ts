/**
 * bin/bake.ts
 *
 * Pre-renders and bakes PNG texture masks & JSON metrics for all fallback fonts
 * across discrete size steps (12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px, 36px, 40px, 48px, 56px, 64px, 72px, 80px, 96px, 108px, 120px)
 * for CJK Chinese reference characters ("放轻松").
 */

import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import puppeteer from 'puppeteer-core';
import rawDb from '../src/lib/data/font-metrics.json';
import type { MetricsDb } from '../src/lib/types';

interface BakedMetricRecord {
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
	pngFileName?: string;
	pngBase64?: string;
}

const db = rawDb as MetricsDb;
const BAKE_TEXT = '放轻松';
const BAKE_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 108, 120];

const REPO_ROOT = path.resolve(import.meta.dir, '..');
const STATIC_BAKED_DIR = path.join(REPO_ROOT, 'static', 'baked');
const ROOT_BAKED_DIR = path.join(REPO_ROOT, 'baked');
const FONTS_DIR = path.join(REPO_ROOT, 'fonts');

// Candidate Chrome/Chromium paths on Linux/macOS
const CHROME_CANDIDATES = [
	'/usr/bin/google-chrome',
	'/usr/bin/google-chrome-stable',
	'/usr/bin/chromium',
	'/usr/bin/chromium-browser',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];

function findChromePath(): string {
	for (const candidate of CHROME_CANDIDATES) {
		if (fs.existsSync(candidate)) return candidate;
	}
	throw new Error('No Chrome/Chromium executable found for headless rendering');
}

function findFontFiles(): Map<string, { fullPath: string; fileName: string }> {
	const map = new Map<string, { fullPath: string; fileName: string }>();
	if (!fs.existsSync(FONTS_DIR)) return map;

	const files = fs.readdirSync(FONTS_DIR);
	for (const file of files) {
		if (/\.(ttf|otf|ttc)$/i.test(file)) {
			const fullPath = path.join(FONTS_DIR, file);
			try {
				const buffer = fs.readFileSync(fullPath);
				const font = opentype.parse(buffer.buffer);
				const family = font.names.fontFamily?.en || font.names.fullName?.en || file;
				map.set(family, { fullPath, fileName: file });
			} catch (e) {
				console.warn(`Could not parse TTF/OTF font file ${file}:`, e);
			}
		}
	}
	return map;
}

async function main() {
	console.log('🚀 Initializing Glyph Baking Pipeline...');
	fs.mkdirSync(STATIC_BAKED_DIR, { recursive: true });
	fs.mkdirSync(ROOT_BAKED_DIR, { recursive: true });

	const fontFiles = findFontFiles();
	const extractedFonts = new Map<string, { fullPath: string; fileName: string }>();

	for (const entry of db.fallbacks) {
		const family = entry.family;
		const fontFile = entry.file;

		let fontMatch = fontFiles.get(family);
		if (!fontMatch) {
			for (const [fam, info] of fontFiles.entries()) {
				if (
					info.fileName.toLowerCase() === fontFile.toLowerCase() ||
					fam.toLowerCase() === family.toLowerCase()
				) {
					fontMatch = info;
					break;
				}
			}
		}

		if (!fontMatch) {
			console.warn(`  ! Font file for "${family}" (${fontFile}) not found in ./fonts`);
			continue;
		}

		try {
			const buffer = fs.readFileSync(fontMatch.fullPath);
			const parsed = opentype.parse(buffer.buffer);

			if (parsed.pages && parsed.pages.length > 0) {
				const singleFont = parsed.pages[0];
				const outTtfPath = path.join(FONTS_DIR, `${fontMatch.fileName}.ttf`);
				const ttfArrayBuffer = singleFont.toPath().toFunction();
				fs.writeFileSync(outTtfPath, Buffer.from(ttfArrayBuffer as unknown as ArrayBuffer));

				extractedFonts.set(family, {
					fullPath: outTtfPath,
					fileName: `${fontMatch.fileName}.ttf`
				});
			} else {
				extractedFonts.set(family, fontMatch);
				console.log(
					`  ✓ Repackaged ${family} (${(fs.statSync(fontMatch.fullPath).size / 1024 / 1024).toFixed(1)} MB)`
				);
			}
		} catch (e) {
			console.warn(`  ! Extraction error for ${family}:`, e);
		}
	}

	// Start Bun HTTP server on dynamic free port for Puppeteer & live browser inspection
	const server = Bun.serve({
		port: 0,
		fetch(req) {
			const url = new URL(req.url);
			const fileName = path.basename(url.pathname);
			const fontPath = path.join(FONTS_DIR, fileName);

			if (fs.existsSync(fontPath)) {
				return new Response(Bun.file(fontPath), {
					headers: {
						'Content-Type': 'font/ttf',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}

			return new Response(
				'<html><body><div id="stage" style="font-size:100px;">放轻松</div></body></html>',
				{
					headers: { 'Content-Type': 'text/html' }
				}
			);
		}
	});

	console.log(`📡 Local font server started at http://127.0.0.1:${server.port}`);

	const chromePath = findChromePath();
	const browser = await puppeteer.launch({
		executablePath: chromePath,
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	try {
		const page = await browser.newPage();
		await page.goto(`http://127.0.0.1:${server.port}/`);

		const allBakedResults: Record<string, BakedMetricRecord[]> = {};

		for (const entry of db.fallbacks) {
			const family = entry.family;
			const fontInfo = extractedFonts.get(family);
			if (!fontInfo) continue;

			const slug = family
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
			const familyDirStatic = path.join(STATIC_BAKED_DIR, slug);
			const familyDirRoot = path.join(ROOT_BAKED_DIR, slug);

			fs.mkdirSync(familyDirStatic, { recursive: true });
			fs.mkdirSync(familyDirRoot, { recursive: true });

			console.log(`Baking PNG glyphs for ${family} ("放轻松")...`);

			const fontUrl = `http://127.0.0.1:${server.port}/${fontInfo.fileName}`;

			try {
				const fontResults = await page.evaluate(
					async (args: { family: string; fontUrl: string; text: string; sizes: number[] }) => {
						const fontFace = new FontFace(args.family, `url("${args.fontUrl}")`);
						await fontFace.load();
						document.fonts.add(fontFace);
						await document.fonts.ready;

						if (fontFace.status !== 'loaded') {
							throw new Error(`FontFace ${args.family} status is not loaded: ${fontFace.status}`);
						}

						const results: BakedMetricRecord[] = [];
						const chars = args.text.split('');

						for (const size of args.sizes) {
							for (const char of chars) {
								const padding = Math.max(16, Math.ceil(size * 0.4));
								const canvasWidth = Math.ceil(size * 2 + padding * 2);
								const canvasHeight = Math.ceil(size * 2 + padding * 2);

								const canvas = document.createElement('canvas');
								canvas.width = canvasWidth;
								canvas.height = canvasHeight;
								const ctx = canvas.getContext('2d', { willReadFrequently: true });
								if (!ctx) continue;

								ctx.clearRect(0, 0, canvasWidth, canvasHeight);
								ctx.font = `${size}px "${args.family}"`;
								ctx.textBaseline = 'alphabetic';
								ctx.fillStyle = '#ffffff';

								const m = ctx.measureText(char);
								const baselineX = Math.round(canvasWidth / 2 - m.width / 2);
								const baselineY = Math.round(canvasHeight / 2 + size * 0.3);

								ctx.fillText(char, baselineX, baselineY);

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

								const dataUrl = canvas.toDataURL('image/png');
								const pngBase64 = dataUrl.replace(/^data:image\/png;base64,/, '');

								results.push({
									fontFamily: args.family,
									char,
									fontSize: size,
									advanceWidth: m.width,
									fontBoundingBoxAscent: m.fontBoundingBoxAscent || size * 0.85,
									fontBoundingBoxDescent: m.fontBoundingBoxDescent || size * 0.15,
									actualBoundingBoxAscent: m.actualBoundingBoxAscent || size * 0.7,
									actualBoundingBoxDescent: m.actualBoundingBoxDescent || size * 0.1,
									actualBoundingBoxLeft: m.actualBoundingBoxLeft || 0,
									actualBoundingBoxRight: m.actualBoundingBoxRight || m.width,
									pixelBox: {
										x: minX,
										y: minY,
										width: pixelWidth,
										height: pixelHeight
									},
									pngBase64
								});
							}
						}
						return results;
					},
					{ family, fontUrl, text: BAKE_TEXT, sizes: BAKE_SIZES }
				);

				const savedRecords: BakedMetricRecord[] = [];

				for (const item of fontResults) {
					const pngName = `${item.char}_${item.fontSize}px.png`;
					const pngBuffer = Buffer.from(item.pngBase64 || '', 'base64');

					fs.writeFileSync(path.join(familyDirStatic, pngName), pngBuffer);
					fs.writeFileSync(path.join(familyDirRoot, pngName), pngBuffer);

					savedRecords.push({
						fontFamily: item.fontFamily,
						char: item.char,
						fontSize: item.fontSize,
						advanceWidth: item.advanceWidth,
						fontBoundingBoxAscent: item.fontBoundingBoxAscent,
						fontBoundingBoxDescent: item.fontBoundingBoxDescent,
						actualBoundingBoxAscent: item.actualBoundingBoxAscent,
						actualBoundingBoxDescent: item.actualBoundingBoxDescent,
						actualBoundingBoxLeft: item.actualBoundingBoxLeft,
						actualBoundingBoxRight: item.actualBoundingBoxRight,
						pixelBox: item.pixelBox,
						pngFileName: pngName
					});
				}

				allBakedResults[family] = savedRecords;

				const metricsJson = JSON.stringify(savedRecords, null, 2);
				fs.writeFileSync(path.join(familyDirStatic, 'metrics-manifest.json'), metricsJson);
				fs.writeFileSync(path.join(familyDirRoot, 'metrics-manifest.json'), metricsJson);

				console.log(`  ✓ Baked ${savedRecords.length} PNG masks for ${family}`);
			} catch (e) {
				console.error(`  ✕ Error baking ${family}:`, e);
			}
		}

		const masterManifestJson = JSON.stringify(allBakedResults, null, 2);
		fs.writeFileSync(path.join(STATIC_BAKED_DIR, 'master-manifest.json'), masterManifestJson);
		fs.writeFileSync(path.join(ROOT_BAKED_DIR, 'master-manifest.json'), masterManifestJson);

		console.log('✅ Glyph Texture Baking Complete!');
	} finally {
		await browser.close();
		server.stop();
	}
}

main().catch((err) => {
	console.error('Fatal bake error:', err);
	process.exit(1);
});
