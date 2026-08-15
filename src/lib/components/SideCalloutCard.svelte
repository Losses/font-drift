<script lang="ts">
	let {
		title,
		value,
		isLeft = true,
		topY = 0,
		isWhiteBorder = false
	}: {
		title: string;
		value: string;
		isLeft?: boolean;
		topY: number;
		isWhiteBorder?: boolean;
	} = $props();
</script>

<div
	class="blueprint-card side-card {isLeft ? 'side-card-left' : 'side-card-right'} {isWhiteBorder
		? 'border-white-override'
		: ''}"
	style="top: {topY}px;"
>
	<div class="card-row-item card-header {isWhiteBorder ? 'border-white-divider' : ''}">
		{title}
	</div>
	<div class="card-row-item card-value {isWhiteBorder ? 'font-bold-white' : ''}">
		{value}
	</div>
</div>

<style>
	.side-card {
		position: absolute;
		display: flex;
		flex-direction: column;
		padding: 0 !important;
		border: 1.5px solid #dbe8f8;
		background-color: #195782;
		border-radius: 0 !important;
		box-shadow: none !important;
		width: 160px;
		transform: translateY(-50%);
		opacity: 1;
	}

	.side-card-left {
		left: 40px;
	}

	.side-card-right {
		right: 40px;
	}

	.border-white-override {
		border-color: #ffffff !important;
	}

	.border-white-divider {
		border-bottom-color: rgba(255, 255, 255, 0.4) !important;
	}

	.font-bold-white {
		color: #ffffff !important;
		font-weight: 700;
	}

	.card-row-item {
		padding-left: 0.5em !important;
		padding-right: 0.5em !important;
	}

	.card-header {
		width: 100%;
		padding-top: 2px;
		padding-bottom: 2px;
		font-weight: 700;
		color: #ffffff;
		text-transform: uppercase;
		font-size: 11px;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(219, 232, 248, 0.3);
	}

	.card-value {
		width: 100%;
		padding-top: 2px;
		padding-bottom: 2px;
		color: #dbe8f8;
		font-size: 11px;
		font-family: monospace;
	}
</style>
