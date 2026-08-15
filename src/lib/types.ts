export interface BrowserMetrics {
	ascent: number;
	descent: number;
	inkAscent: number;
	inkDescent: number;
	lineBox: number;
	widths: Record<string, number>;
}

export interface TableMetrics {
	familyName: string | null;
	subfamilyName: string | null;
	postscriptName: string | null;
	unitsPerEm: number | null;
	hhea: {
		ascender: number | null;
		descender: number | null;
		lineGap: number | null;
	};
	os2: {
		typoAscender: number | null;
		typoDescender: number | null;
		typoLineGap: number | null;
		winAscent: number | null;
		winDescent: number | null;
		useTypoMetrics: boolean | null;
	} | null;
	collectionFaces: number | null;
	nameRecords: { nameID: number; value: string }[];
}

export interface FallbackEntry {
	family: string;
	local: string[];
	file: string;
	tables: TableMetrics;
	browser: BrowserMetrics;
}

export interface MetricsDb {
	schema: number;
	updated: string;
	referenceStrings: Record<string, string>;
	fallbacks: FallbackEntry[];
}

export interface CustomFont {
	id: string;
	name: string;
	family: string;
	url?: string;
	arrayBuffer?: ArrayBuffer;
	isCustom: boolean;
	/** Ordered local() candidate names (family / preferred family / full / PostScript, all locales) */
	localNames?: string[];
	unitsPerEm: number;
	ascender: number;
	descender: number;
	capHeight: number;
	xHeight: number;
	lineGap: number;
	browserAscent: number;
	browserDescent: number;
	browserInkAscent: number;
	browserInkDescent: number;
	lineBox: number;
	cjkWidth: number;
}

export interface GeneratedCssResult {
	fontFamily: string;
	baseFamily: string;
	sizeAdjust: number; // e.g. 1.05 (105%)
	ascentOverride: number; // e.g. 0.95 (95%)
	descentOverride: number; // e.g. 0.25 (25%)
	lineGapOverride: number; // e.g. 0.00 (0%)
	// Tonsky centering offset
	capOffsetEm: number;
	cjkOffsetEm: number;
	// Raw CSS snippets
	fontFaceCss: string;
	tonskyFlexCss: string;
	tonskyCalcCss: string;
	fullCss: string;
}

export interface BakedCharMetrics {
	char: string;
	fontSize: number;
	fontFamily: string;
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
	dataUrl: string;
	pngFileName?: string;
}

export interface BakedResultSet {
	fontFamily: string;
	text: string;
	sizes: number[];
	metrics: BakedCharMetrics[];
	timestamp: string;
}
