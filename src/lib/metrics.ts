import opentype from 'opentype.js';
import type { CustomFont, FallbackEntry, GeneratedCssResult, MetricsDb } from './types';
import rawDb from './data/font-metrics.json';

const metricsDb = rawDb as MetricsDb;

export const INITIAL_FALLBACKS: FallbackEntry[] = metricsDb.fallbacks;

/**
 * Default reference base font metrics (PingFang SC Regular / Standard Reference)
 */
export const DEFAULT_BASE_FONT: CustomFont = {
	id: 'pingfang-sc-base',
	name: 'PingFang SC Regular',
	family: 'PingFang SC Regular',
	isCustom: false,
	unitsPerEm: 1000,
	ascender: 1060,
	descender: -340,
	capHeight: 700,
	xHeight: 500,
	lineGap: 0,
	browserAscent: 88,
	browserDescent: 12,
	browserInkAscent: 84,
	browserInkDescent: 26,
	lineBox: 100, // PingFang SC native lineBox (100% = 1.0em, 0% line gap)
	cjkWidth: 100.0
};

/**
 * Measure in-browser canvas TextMetrics & DOM line box height for any loaded font family
 */
export function measureFontInBrowser(
	family: string,
	emPx = 100
): {
	ascent: number;
	descent: number;
	inkAscent: number;
	inkDescent: number;
	lineBox: number;
	cjkWidth: number;
} {
	if (typeof document === 'undefined') {
		return {
			ascent: 88,
			descent: 12,
			inkAscent: 84,
			inkDescent: 26,
			lineBox: 100,
			cjkWidth: 100.0
		};
	}

	const refText = metricsDb.referenceStrings?.cjk || '永是一的国我上不为和';
	const singleChar = '放';

	// Canvas TextMetrics
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas 2D context not supported');
	}

	ctx.font = `${emPx}px "${family}", sans-serif`;
	const mRef = ctx.measureText(refText);
	const mChar = ctx.measureText(singleChar);

	const ascent = mRef.fontBoundingBoxAscent || emPx * 0.88;
	const descent = mRef.fontBoundingBoxDescent || emPx * 0.12;
	const inkAscent = mChar.actualBoundingBoxAscent || emPx * 0.84;
	const inkDescent = mChar.actualBoundingBoxDescent || emPx * 0.26;

	// DOM Probe for lineBox height
	const probe = document.createElement('div');
	probe.style.cssText =
		'position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;margin:0;padding:0;border:0;line-height:normal;';
	probe.style.font = `${emPx}px "${family}", sans-serif`;
	probe.textContent = refText;
	document.body.appendChild(probe);
	const lineBox = probe.getBoundingClientRect().height || ascent + descent;
	document.body.removeChild(probe);

	return {
		ascent,
		descent,
		inkAscent,
		inkDescent,
		lineBox,
		cjkWidth: mRef.width / refText.length
	};
}

/**
 * Parse an uploaded font file using opentype.js and browser memory FontFace + Blob URL
 */
export async function parseUploadedFont(
	file: File
): Promise<{ font: CustomFont; fontFace: FontFace }> {
	const arrayBuffer = await file.arrayBuffer();
	const parsed = opentype.parse(arrayBuffer);

	const familyName =
		parsed.names.fontFamily?.en ||
		parsed.names.fullName?.en ||
		parsed.names.postScriptName?.en ||
		file.name.replace(/\.[^/.]+$/, '');

	// Create memory Blob URL so CSS @font-face rules can consume the webfont bytes directly
	const fontUrl = URL.createObjectURL(file);

	const fontFace = new FontFace(familyName, arrayBuffer);
	await fontFace.load();
	document.fonts.add(fontFace);

	// Wait for font loading confirmation
	await document.fonts.ready;

	const browserM = measureFontInBrowser(familyName, 100);

	const font: CustomFont = {
		id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		name: familyName,
		family: familyName,
		url: fontUrl,
		arrayBuffer,
		isCustom: true,
		unitsPerEm: parsed.unitsPerEm || 1000,
		ascender: parsed.tables.os2?.sTypoAscender ?? parsed.ascender ?? 800,
		descender: parsed.tables.os2?.sTypoDescender ?? parsed.descender ?? -200,
		capHeight: parsed.tables.os2?.sCapHeight ?? Math.round((parsed.unitsPerEm || 1000) * 0.7),
		xHeight: parsed.tables.os2?.sxHeight ?? Math.round((parsed.unitsPerEm || 1000) * 0.5),
		lineGap: parsed.tables.hhea?.lineGap ?? parsed.tables.os2?.sTypoLineGap ?? 0,
		browserAscent: browserM.ascent,
		browserDescent: browserM.descent,
		browserInkAscent: browserM.inkAscent,
		browserInkDescent: browserM.inkDescent,
		lineBox: browserM.lineBox,
		cjkWidth: browserM.cjkWidth
	};

	return { font, fontFace };
}

/**
 * Convert FallbackEntry from database JSON into CustomFont object
 */
export function fallbackToCustomFont(entry: FallbackEntry): CustomFont {
	const t = entry.tables;
	const b = entry.browser;

	return {
		id: `db-${entry.family}`,
		name: entry.family,
		family: entry.family,
		isCustom: false,
		unitsPerEm: t.unitsPerEm || 1000,
		ascender: t.os2?.typoAscender ?? t.hhea.ascender ?? 880,
		descender: t.os2?.typoDescender ?? t.hhea.descender ?? -120,
		capHeight: Math.round((t.unitsPerEm || 1000) * 0.7),
		xHeight: Math.round((t.unitsPerEm || 1000) * 0.5),
		lineGap: t.hhea.lineGap ?? t.os2?.typoLineGap ?? 0,
		browserAscent: b.ascent,
		browserDescent: b.descent,
		browserInkAscent: b.inkAscent,
		browserInkDescent: b.inkDescent,
		lineBox: b.lineBox,
		cjkWidth: b.widths.cjk ? (b.widths.cjk > 200 ? b.widths.cjk / 10 : b.widths.cjk) : 100.0
	};
}

const pct = (v: number, digits = 4) => `${(v * 100).toFixed(digits)}%`;

/**
 * Calculate Metric Overrides CSS based on exact bin/font-fallback/generate.ts logic
 */
export function calculateAlignmentCss(
	target: CustomFont,
	base: CustomFont = DEFAULT_BASE_FONT
): GeneratedCssResult {
	const k = base.cjkWidth > 0 && target.cjkWidth > 0 ? base.cjkWidth / target.cjkWidth : 1.0;

	// Base font native line gap (PingFang SC line gap is 0%)
	const baseGapRatio = Math.max(0, (base.lineBox - base.browserAscent - base.browserDescent) / 100);

	const sizeAdjustRatio = k;
	const ascentOverrideRatio = base.browserAscent / (k * 100);
	const descentOverrideRatio = base.browserDescent / (k * 100);
	const lineGapOverrideRatio = baseGapRatio / k;

	// Tonsky cap-height vertical offset in em units:
	const targetCapHeight = target.capHeight || target.unitsPerEm * 0.7;
	const capOffsetEm =
		(target.ascender - Math.abs(target.descender) - targetCapHeight) / (2 * target.unitsPerEm);

	// CJK character optical center offset em:
	const cjkOffsetEm =
		(target.browserInkAscent - target.browserInkDescent) / 200 -
		(target.browserAscent - target.browserDescent) / 200;

	const fallbackEntry = metricsDb.fallbacks.find(
		(f) => f.family.toLowerCase() === target.family.toLowerCase()
	);
	const localList = fallbackEntry?.local || [target.family];
	const srcDecl = target.url
		? `url("${target.url}"), local("${target.family}")`
		: localList.map((n) => `local("${n}")`).join(', ');

	const fallbackFamilyName = `${base.family.replace(/\s+Regular$/i, '')} Fallback ${target.family}`;

	const tableNote = target.unitsPerEm
		? ` Tables: upm ${target.unitsPerEm}, hhea ${target.ascender}/${target.descender}/${target.lineGap}.`
		: '';

	const fontFaceCss = [
		`/* ${target.family} (${fallbackEntry?.file || 'custom'}).${tableNote} */`,
		`@font-face {`,
		`  font-family: "${fallbackFamilyName}";`,
		`  src: ${srcDecl};`,
		`  size-adjust: ${pct(sizeAdjustRatio)};`,
		`  ascent-override: ${pct(ascentOverrideRatio)};`,
		`  descent-override: ${pct(descentOverrideRatio)};`,
		`  line-gap-override: ${pct(lineGapOverrideRatio)};`,
		`  font-display: block;`,
		`}`
	].join('\n');

	const tonskyFlexCss = [
		`/* Metric-compatible font-family stack */`,
		`font-family: "${base.family}", "${fallbackFamilyName}", sans-serif;`
	].join('\n');

	const tonskyCalcCss = '';

	const fullCss = [fontFaceCss, ``, `/* Suggested CSS font-family stack */`, tonskyFlexCss].join(
		'\n'
	);

	return {
		fontFamily: target.family,
		baseFamily: base.family,
		sizeAdjust: sizeAdjustRatio,
		ascentOverride: ascentOverrideRatio,
		descentOverride: descentOverrideRatio,
		lineGapOverride: lineGapOverrideRatio,
		capOffsetEm,
		cjkOffsetEm,
		fontFaceCss,
		tonskyFlexCss,
		tonskyCalcCss,
		fullCss
	};
}

/**
 * Generates complete, stable CSS specification file matching blog3's bin/font-fallback/generate.ts output
 */
export function generateAllFontsCssPackage(
	base: CustomFont = DEFAULT_BASE_FONT,
	customFonts: CustomFont[] = []
): string {
	const allFonts = [...customFonts, ...INITIAL_FALLBACKS.map(fallbackToCustomFont)];

	const fallbackNames = allFonts.map((f) => {
		const name = `${base.family.replace(/\s+Regular$/i, '')} Fallback ${f.family}`;
		return `"${name}"`;
	});

	const fallbackChainList = fallbackNames.join(', ');

	const blocks: string[] = [];

	blocks.push(`/* Metric-compatible fallbacks for ${base.family}.`);
	blocks.push(
		` * Generated by Font Drift Alignment Engine ${new Date().toISOString()}. Do not edit by hand.`
	);
	blocks.push(
		` * Target measured through: ${base.family}; at 100px em: ascent ${base.browserAscent.toFixed(2)}px, descent ${base.browserDescent.toFixed(2)}px, line box ${base.lineBox.toFixed(2)}px, CJK advance ${base.cjkWidth.toFixed(2)}px/char.`
	);
	blocks.push(` * Each face wraps one local font via local() with size-adjust and`);
	blocks.push(` * ascent/descent/line-gap overrides, reproducing the webfont line box and`);
	blocks.push(` * CJK advance.`);
	blocks.push(` * Stack the families in font-family order after the webfont name; the`);
	blocks.push(` * first family resolving a local font on the visitor OS wins:`);
	blocks.push(` *   font-family: "${base.family}", ${fallbackChainList}, sans-serif; */\n`);

	for (const font of allFonts) {
		const align = calculateAlignmentCss(font, base);
		blocks.push(align.fontFaceCss);
		blocks.push('');
	}

	return blocks.join('\n');
}
