<script lang="ts">
	import { Upload } from 'lucide-svelte';

	let {
		isDraggingFile = false,
		onFileInputChange = () => {}
	}: {
		isDraggingFile?: boolean;
		onFileInputChange: (e: Event) => void;
	} = $props();
</script>

<div
	role="region"
	aria-label="Font File Dropzone"
	class="crystal-capsule upload-button {isDraggingFile ? 'upload-button-dragging' : ''}"
>
	<input
		type="file"
		accept=".ttf,.otf,.woff,.woff2"
		multiple
		onchange={onFileInputChange}
		class="file-input-hidden"
	/>
	<Upload size={40} color="#ffffff" />
</div>

<style>
	.upload-button {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 !important;
		cursor: pointer;
		width: 100%;
		max-width: 320px;
		height: 240px;
		margin-left: auto;
		margin-right: auto;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.upload-button:hover {
		transform: scale(1.02);
	}

	.upload-button-dragging {
		border-color: #ffffff !important;
		background-color: rgba(255, 255, 255, 0.25) !important;
		transform: scale(1.03) !important;
	}

	.file-input-hidden {
		position: absolute;
		inset: 0;
		cursor: pointer;
		opacity: 0;
		z-index: 20;
	}
</style>
