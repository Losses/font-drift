/**
 * Downloads a text file (e.g. font-alignment.css)
 */
export function downloadTextFile(filename: string, text: string) {
	if (typeof document === 'undefined') return;
	const blob = new Blob([text], { type: 'text/css;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Calculates mouse position relative to long edge vs short edge depending on screen orientation.
 * Returns normalized longEdgeRatio [0..1] and shortEdgeRatio [0..1]
 */
export function getScreenEdgeRatios(
	mouseX: number,
	mouseY: number,
	winWidth: number,
	winHeight: number
): {
	isLandscape: boolean;
	longEdgeValue: number; // e.g. mouse position along long edge
	shortEdgeValue: number; // e.g. mouse position along short edge
	longEdgeMax: number;
	shortEdgeMax: number;
	longEdgeRatio: number; // 0 to 1
	shortEdgeRatio: number; // 0 to 1
} {
	const isLandscape = winWidth >= winHeight;

	const longEdgeValue = isLandscape ? mouseX : mouseY;
	const shortEdgeValue = isLandscape ? mouseY : mouseX;

	const longEdgeMax = isLandscape ? winWidth : winHeight;
	const shortEdgeMax = isLandscape ? winHeight : winWidth;

	const longEdgeRatio = Math.max(0, Math.min(1, longEdgeValue / (longEdgeMax || 1)));
	const shortEdgeRatio = Math.max(0, Math.min(1, shortEdgeValue / (shortEdgeMax || 1)));

	return {
		isLandscape,
		longEdgeValue,
		shortEdgeValue,
		longEdgeMax,
		shortEdgeMax,
		longEdgeRatio,
		shortEdgeRatio
	};
}
