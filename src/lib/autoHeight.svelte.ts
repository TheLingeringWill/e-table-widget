export const autoHeight = (node: HTMLElement) => {
	const notifyParentWindow = (height: number) => {
		window.parent?.postMessage({ type: 'resize', data: height }, '*');
	};
	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		if (entry.contentRect.height > 0) {
			notifyParentWindow(entry.contentRect.height);
		}
	});

	observer.observe(node);
	const height = node.clientHeight;
	notifyParentWindow(height);
};
