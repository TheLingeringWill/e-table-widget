<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/Widget/Button.svelte';

	const error = $page.error;
	const status = $page.status;
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-lg shadow-lg p-8">
			<div class="flex flex-col items-center text-center gap-6">
				<!-- Error Icon -->
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</div>

				<!-- Error Title -->
				<h1 class="text-2xl font-bold text-gray-900">
					{#if status === 403}
						Annulation impossible
					{:else if status === 404}
						Réservation introuvable
					{:else}
						Une erreur est survenue
					{/if}
				</h1>

				<!-- Error Message -->
				<p class="text-gray-600 leading-relaxed">
					{error?.message || "Nous n'avons pas pu traiter votre demande."}
				</p>

				<!-- Error Code (optional) -->
				{#if status}
					<p class="text-sm text-gray-400">
						Code erreur: {status}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
