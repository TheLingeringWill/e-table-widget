<script lang="ts">
	type Func = (...args: any[]) => void;
	type Execute = (Func | [Func, Record<string, string | number>])[];
	let {
		execute = [],
		stylize = []
	}: {
		execute?: Execute;
		stylize?: string[];
	} = $props();
</script>

<svelte:head>
	{@html `<s${'cript'}>
		document.addEventListener('DOMContentLoaded', () => {
        	${execute
						.map((fn) => {
							if (typeof fn === 'function') {
								return `(${fn.toString()})();`;
							} else {
								let stringified = fn[0].toString();
								const args = fn[1];

								Object.entries(args).forEach(([key, value]) => {
									let occurrences = [];
									let index = stringified.indexOf(key);
									while (index !== -1) {
										occurrences.push(index);
										index = stringified.indexOf(key, index + 1);
									}
									occurrences.shift();
									occurrences.forEach((index) => {
										stringified =
											stringified.slice(0, index) +
											`"${value}"` +
											stringified.slice(index + key.length);
									});
								});
								return `(${stringified})();`;
							}
						})
						.join('\n')}
		})
	</s${'cript'}>`}
	{@html `<s${'tyle'}>
            ${stylize.join('\n\n')}
        </s${'tyle'}>`}
</svelte:head>
