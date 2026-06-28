export const loader = (node, opts) => {
    const setSpinner = ({ loading, size }) => {
        if (loading) {
            if (!parentAnimation) {
                // only append spinner if it doesn't exist and animation is not running
                const spinner = document.createElement('span');
                node.style.setProperty('position', 'relative');
                spinner.className = 'ui-spinner';
                const spinnerDiv = document.createElement('div');
                if (opts.class) {
                    spinnerDiv.classList.add(opts.class);
                }
                spinnerDiv.style.setProperty('overflow', 'hidden');
                const parentDimension = node.getBoundingClientRect();
                const parentBorder = parseInt(getComputedStyle(node).borderWidth);
                const parentRadius = parseInt(getComputedStyle(node).borderRadius);
                spinnerDiv.style.setProperty('width', `${parentDimension.width - 2 * parentBorder}px`);
                spinnerDiv.style.setProperty('height', `${parentDimension.height - 2 * parentBorder}px`);
                spinnerDiv.style.setProperty('border-radius', `${parentRadius}px`);
                spinnerDiv.style.setProperty('position', 'absolute');
                spinnerDiv.style.setProperty('top', '0');
                spinnerDiv.style.setProperty('left', '0');
                spinnerDiv.style.setProperty('background-color', 'var(--current-background)');
                spinnerDiv.style.setProperty('display', 'flex');
                spinnerDiv.style.setProperty('justify-content', 'center');
                spinnerDiv.style.setProperty('align-items', 'center');
                spinnerDiv.style.setProperty('backdrop-filter', 'blur(10px)');
                if (size) {
                    spinnerDiv.style.setProperty('--spinner-size', `${size}px`);
                }
                else {
                    spinnerDiv.style.setProperty('--spinner-size', parentDimension.height * 0.65 + 'px');
                }
                spinnerDiv.appendChild(spinner);
                node.appendChild(spinnerDiv);
                parentAnimation = spinnerDiv.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: 200
                });
            }
            else {
                parentAnimation.reverse();
                parentAnimation.onfinish = () => { };
            }
        }
        else {
            const spinner = node.querySelector('.ui-spinner');
            if (!spinner || !spinner.parentElement)
                return;
            parentAnimation?.reverse();
            if (parentAnimation) {
                parentAnimation.onfinish = () => {
                    spinner && node.removeChild(spinner.parentElement);
                    parentAnimation = undefined;
                };
            }
        }
    };
    let parentAnimation;
    setSpinner(opts);
    return {
        update(opts) {
            setSpinner(opts);
        },
        destroy() {
            setSpinner({ loading: false });
        }
    };
};
