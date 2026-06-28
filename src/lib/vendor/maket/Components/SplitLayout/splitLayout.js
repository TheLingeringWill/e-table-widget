import { buildComponent } from '../../plugin/componentBuilder.js';
const getRelativeWidth = (state, element) => {
    const node = state[element].node;
    const container = state.container.node;
    if (state.direction === 'vertical') {
        return (node.clientHeight / container.clientHeight) * 100;
    }
    else {
        return (node.clientWidth / container.clientWidth) * 100;
    }
};
const makeState = (disabled, dragging, position, node, direction, paneBefore, paneAfter) => {
    const parent = node.parentElement;
    const beforeNode = node.previousElementSibling;
    const afterNode = node.nextElementSibling;
    return {
        disabled,
        dragging,
        position,
        direction,
        before: {
            get state() {
                return paneBefore;
            },
            set state(value) {
                paneBefore = value;
            },
            node: beforeNode,
            dimension: direction === 'vertical' ? beforeNode.clientHeight : beforeNode.clientWidth
        },
        after: {
            get state() {
                return paneAfter;
            },
            set state(value) {
                paneAfter = value;
            },
            node: afterNode,
            dimension: direction === 'vertical' ? afterNode.clientHeight : afterNode.clientWidth
        },
        container: {
            node: parent,
            dimension: direction === 'vertical' ? parent.clientHeight : parent.clientWidth
        }
    };
};
export const splitLayout = (node, { disabled, position, direction: dir = 'horizontal', paneBefore, paneAfter }) => {
    let state = makeState(disabled, false, position, node, dir, paneBefore, paneAfter);
    let start = {
        x: 0,
        y: 0
    };
    let shouldCollapseBefore = false;
    let shouldCollapseAfter = false;
    function update(event) {
        if (disabled)
            return;
        const delta = state.direction === 'vertical' ? event.clientY - start.y : event.clientX - start.x;
        const deltaKey = state.direction === 'vertical' ? 'top' : 'left';
        const sizeKey = state.direction === 'vertical' ? 'height' : 'width';
        const newSizeBefore = state.before.dimension + delta;
        const newSizeAfter = state.after.dimension - delta;
        const relativeNewSizeBefore = (newSizeBefore / state.container.dimension) * 100;
        const relativeNewSizeAfter = (newSizeAfter / state.container.dimension) * 100;
        const shouldCollapseBefore = state.before.state.collapsedSize && relativeNewSizeBefore <= state.before.state.collapsedSize;
        const shouldCollapseAfter = state.after.state.collapsedSize && relativeNewSizeAfter <= state.after.state.collapsedSize;
        state.before.node.setAttribute('data-collapsed', (!!shouldCollapseBefore).toString());
        state.after.node.setAttribute('data-collapsed', (!!shouldCollapseAfter).toString());
        if (shouldCollapseBefore) {
            node.style.setProperty(deltaKey, `${state.position - state.before.state.size + state.before.state.collapsedSize}%`);
            state.before.node.style.setProperty(sizeKey, `${state.before.state.collapsedSize}%`);
            state.after.node.style.setProperty(sizeKey, `calc(${state.after.dimension + state.before.dimension}px  - ${state.before.state.collapsedSize}%)`);
        }
        else if (shouldCollapseAfter) {
            node.style.setProperty(deltaKey, `${state.after.state.size + state.position - state.before.state.collapsedSize}%`);
            state.after.node.style.setProperty(sizeKey, `${state.after.state.collapsedSize}%`);
            state.before.node.style.setProperty(sizeKey, `calc(${state.after.dimension + state.before.dimension}px  - ${state.before.state.collapsedSize}%)`);
        }
        else {
            if (relativeNewSizeBefore <= (state.before.state.min || 0) ||
                relativeNewSizeAfter <= (state.after.state.min || 0) ||
                relativeNewSizeBefore >= (state.before.state.max || 100) ||
                relativeNewSizeAfter >= (state.after.state.max || 100)) {
                return;
            }
            node.style.setProperty(deltaKey, `calc(${state.position}% + ${delta}px)`);
            state.before.node.style.setProperty(sizeKey, `${newSizeBefore}px`);
            state.after.node.style.setProperty(sizeKey, `${newSizeAfter}px`);
        }
    }
    const pointerdown = (event) => {
        if ((event.pointerType === 'mouse' && event.button === 2) ||
            (event.pointerType !== 'mouse' && !event.isPrimary)) {
            return;
        }
        node.setPointerCapture(event.pointerId);
        event.preventDefault();
        start = {
            x: event.clientX,
            y: event.clientY
        };
        state = makeState(state.disabled, true, state.position, node, state.direction, paneBefore, paneAfter);
        const onpointerup = () => {
            state.dragging = false;
            node.setPointerCapture(event.pointerId);
            window.removeEventListener('pointermove', update, false);
            window.removeEventListener('pointerup', onpointerup, false);
            // UPDATE
            state.before.state.size = Number(getRelativeWidth(state, 'before').toFixed(3));
            state.after.state.size = Number(getRelativeWidth(state, 'after').toFixed(3));
            state.before.state.collapsed = !!shouldCollapseBefore;
            state.after.state.collapsed = !!shouldCollapseAfter;
            const panes = Array.from(state.container.node.childNodes).filter((node) => node instanceof HTMLElement && node.classList.contains('ui-split-layout-pane'));
            const totalWidth = panes.reduce((acc, pane) => acc + Number(pane.clientWidth), 0);
            const containerWidth = state.container.node.clientWidth;
            const missingWidth = containerWidth - totalWidth;
            if (missingWidth > 0) {
                state.before.node.style.setProperty('width', `${state.before.node.clientWidth + missingWidth}px`);
                state.before.state.size = Number(getRelativeWidth(state, 'before').toFixed(3));
            }
        };
        window.addEventListener('pointermove', update, false);
        window.addEventListener('pointerup', onpointerup, false);
    };
    node.addEventListener('pointerdown', pointerdown, { capture: true, passive: false });
    return {
        update({ disabled, position, direction: dir, paneBefore, paneAfter }) {
            state = makeState(disabled, false, position, node, dir, paneBefore, paneAfter);
        },
        destroy() {
            node.removeEventListener('pointerdown', pointerdown);
        }
    };
};
export const splitLayoutComponent = buildComponent({
    name: 'split-layout',
    attributes: {
        disabled: true,
        collapsed: true,
        vertical: 'direction',
        horizontal: 'direction'
    }
});
