<script lang="ts">
	import { X } from 'phosphor-svelte';
	import { error } from '$lib/states/error.svelte';
</script>

<div class="flex flex-col gap-4 items-center justify-center">
	<X size={80} color="red" />
	{#if !error.message}
		<p>Une erreur est survenue lors de la réservation.<br />Veuillez réessayer.</p>
	{:else}
		<p>{error.message}</p>
	{/if}
	{#if error.code}
		<p class="text-sm opacity-50">{error.code}</p>
	{/if}
</div>
