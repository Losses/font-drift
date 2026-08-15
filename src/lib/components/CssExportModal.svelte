<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { CustomFont } from '$lib/types';
	import { generateAllFontsCssPackage } from '$lib/metrics';
	import { downloadTextFile } from '$lib/utils';

	let {
		isOpen = $bindable(false),
		baseFont,
		customFonts = []
	}: {
		isOpen: boolean;
		baseFont: CustomFont;
		customFonts?: CustomFont[];
	} = $props();

	// Stable, complete all-fonts CSS package
	let fullCss = $derived(generateAllFontsCssPackage(baseFont, customFonts));
	let isCopied = $state(false);

	function copyCss() {
		navigator.clipboard.writeText(fullCss);
		isCopied = true;
		setTimeout(() => (isCopied = false), 2000);
	}

	function downloadCss() {
		downloadTextFile(`font-drift-alignment.css`, fullCss);
	}
</script>

{#if isOpen}
	<div class="modal-overlay">
		<!-- Backdrop -->
		<button
			tabindex="-1"
			onclick={() => (isOpen = false)}
			class="modal-backdrop"
			aria-label="Close modal"
		></button>

		<!-- Pure A4 Paper Sheet Modal Window (Strict Zero Border-Radius, White Paper Blue Text) -->
		<div class="modal-paper-sheet a4-paper-sheet">
			<!-- Header -->
			<div class="modal-header">
				<h2 class="modal-title">GENERATED CSS</h2>
				<button onclick={() => (isOpen = false)} class="close-btn">
					<X size={16} color="#195782" />
				</button>
			</div>

			<!-- CSS Code Output Container -->
			<div class="code-container">
				<pre class="code-block">{fullCss}</pre>
			</div>

			<!-- Action Buttons -->
			<div class="modal-footer">
				<button onclick={copyCss} class="action-btn btn-secondary">
					{isCopied ? 'COPIED!' : 'COPY'}
				</button>

				<button onclick={downloadCss} class="action-btn btn-primary"> DOWNLOAD </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		font-family: monospace;
		font-size: 12px;
		user-select: text;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		background-color: rgba(12, 36, 58, 0.8);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: none;
		cursor: default;
	}

	.modal-paper-sheet {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		max-height: 85vh;
		width: 100%;
		max-width: 768px;
		border-radius: 0 !important;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0;
		margin-bottom: 0;
	}

	.modal-title {
		font-size: 14px;
		font-weight: 700;
		color: #14486f;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid #195782;
		background: #ffffff;
		cursor: pointer;
		border-radius: 0;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.close-btn:hover {
		background: #195782;
	}

	.code-container {
		margin-top: 8px;
		margin-bottom: 8px;
		min-height: 0;
		flex: 1;
		overflow-y: auto;
		border: 2px solid #195782;
		background-color: #f8fafc;
		padding: 16px;
		border-radius: 0;
	}

	.code-block {
		font-family: monospace;
		font-size: 12px;
		line-height: 1.6;
		color: #14486f;
		user-select: text;
		white-space: pre;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 0;
		margin-top: 0;
	}

	.action-btn {
		padding: 0.25em 0.5em;
		font-family: monospace;
		font-weight: 700;
		font-size: 11px;
		cursor: pointer;
		border-radius: 0;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.btn-secondary {
		border: 2px solid #195782;
		background-color: #ffffff;
		color: #195782;
	}

	.btn-secondary:hover {
		background-color: #195782;
		color: #ffffff;
	}

	.btn-primary {
		border: 2px solid #195782;
		background-color: #195782;
		color: #ffffff;
	}

	.btn-primary:hover {
		background-color: #14486f;
	}
</style>
