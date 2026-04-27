<script lang="ts">
	const { size = 64, width = 5, color = '#6366f1' } = $props<{
		size?: number;
		width?: number;
		color?: string;
	}>();
</script>

<div class="loader"></div>

{@html `
	<s${'tyle'}>
	.loader {
		width: ${size}px;
		height: ${size}px;
		border: ${width}px solid;
		border-color: #e5e7eb;
		border-bottom-color: ${color};
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 0.8s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	</s${'tyle'}>
`}
