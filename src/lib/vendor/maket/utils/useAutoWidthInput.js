export const onMountAutoWidthInput = () => {
    const getWidth = (node) => {
        const value = node.getAttribute('data-auto-width') || node.value || node.placeholder;
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = 'fit-content';
        div.textContent = value || 'DEFAULT';
        if (node) {
            div.classList.add(...node.classList);
        }
        document.body.appendChild(div);
        const width = div.getBoundingClientRect().width;
        div.remove();
        return width;
    };
    const nodes = document.querySelectorAll('[data-auto-width]');
    nodes.forEach((node) => {
        node.style.width = `${getWidth(node)}px`;
    });
};
export const autoWidthInput = (node) => {
    const getWidth = (node) => {
        const value = node.getAttribute('data-auto-width') || node.value || node.placeholder;
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = 'fit-content';
        div.textContent = value || 'DEFAULT';
        if (node) {
            div.classList.add(...node.classList);
        }
        document.body.appendChild(div);
        const width = div.getBoundingClientRect().width;
        div.remove();
        return width;
    };
    node.style.width = `${getWidth(node)}px`;
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
                if (mutation.attributeName === 'data-auto-width') {
                    node.style.width = `${getWidth(node)}px`;
                }
            }
        });
    });
    mutationObserver.observe(node, { attributes: true });
};
