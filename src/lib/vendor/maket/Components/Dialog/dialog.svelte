<script module lang="ts">
	declare global {
		interface Document {
			addEventListener<K extends keyof ModalTriggerEventMap>(
				type: K,
				listener: (this: Document, ev: ModalTriggerEventMap[K]) => void
			): void;
			dispatchEvent<K extends keyof ModalTriggerEventMap>(ev: ModalTriggerEventMap[K]): void;
			removeEventListener<K extends keyof ModalTriggerEventMap>(
				type: K,
				listener: (this: Document, ev: ModalTriggerEventMap[K]) => void
			): void;
		}
	}

	export const toggleModal = (id: string, open: boolean) => {
		document.dispatchEvent(
			new CustomEvent('ui_open_modal', {
				detail: { id, open }
			})
		);
	};
</script>

<script lang="ts">
	import { use_theme } from '../../theme.svelte';
	import type { DialogProps } from './dialog.types.js';
	import Button from '../Button/Button.svelte';
	import { useKeyDown } from '../../utils/useKeyDown.svelte';
	import { bgFade, fso, resolveTypedTransitionParams } from '../../transitions/transition.js';
	import Slot from '../Slot/Slot.svelte';
	import { getContext, onMount, setContext, untrack } from 'svelte';
	import { useScrollLock } from '../../utils/useScrollLock.svelte.js';
	import { useClickOutside } from '../../utils/useClickOutside.svelte.js';
	import { useFocusTrap } from '../../utils/useFocusTrap.svelte.js';
	import { DialogState, registerModal, type ModalTriggerEventMap } from './dialogState.svelte.js';
	import { binder } from '../../utils/binder.svelte.js';

	let {
		id: customId,
		isOpen = $bindable(false),
		onClose,
		onOpen,
		trigger,
		size,
		type = 'modal',
		title,
		description,
		children,
		footer,
		header,
		closeOnClickOutside = true,
		closeOnEscape = true,
		overlayClass = '',
		containerClass = '',
		headerClass = '',
		contentClass = '',
		footerClass = '',
		titleClass = '',
		closeButton,
		closable = true,
		closeButtonProps,
		triggerProps,
		triggerClass,
		headerProps,
		descriptionProps,
		titleProps,
		footerProps,
		closeButtonClass = '',
		descriptionClass = '',
		transition
	}: DialogProps = $props();

	const theme = use_theme();

	const dialog = new DialogState(customId, () => ({
		size,
		type,
		transition
	}));

	binder(
		() => [dialog.isOpen, (v) => (isOpen = v)],
		() => [isOpen, (value) => (value ? dialog.open() : dialog.close())]
	);

	useKeyDown({
		get isActive() {
			return closeOnEscape && closable && dialog.isOpen && (dialog.isLastOfStack || dialog.isLast);
		},
		keys: ['Escape'],
		callback: () => {
			dialog.close();
		}
	});

	if (!dialog.parent) {
		useScrollLock({
			get isActive() {
				return dialog.isOpen && theme.dialogs.filter((d) => d.isOpen).length === 1;
			}
		});
	}

	const clickOutside = useClickOutside({
		get isActive() {
			if (!closeOnClickOutside || dialog.stack.some((d) => d.isOpen)) {
				return false;
			}
			return dialog.isOpen && dialog.hasTransitioned;
		},
		callback: dialog.close
	});

	useFocusTrap({
		get isActive() {
			return dialog.isOpen && (dialog.isLastOfStack || dialog.isLast);
		},
		get node() {
			return dialog.element;
		}
	});
</script>

{#if dialog.isOpen}
	<dialog
		open={true}
		id={dialog.id}
		bind:this={dialog.element}
		aria-modal={true}
		aria-labelledby="{dialog.id}-label"
		class="ui-dialog {overlayClass}"
		data-type={dialog.type}
		data-size={size}
		transition:bgFade={{
			duration: 100,
			delay: 0
		}}
	>
		<div
			data-type={dialog.type}
			use:clickOutside.ref
			in:fso={dialog.transition.in}
			out:fso={dialog.transition.out}
			onintroend={() => {
				dialog.hasTransitioned = true;
				onOpen?.(dialog);
			}}
			onoutrostart={() => {
				dialog.hasTransitioned = false;
			}}
			onoutroend={() => onClose?.(dialog)}
			class="ui-dialog-container {containerClass}"
		>
			<Slot render={header} payload={dialog} class={headerClass} props={headerProps}>
				<header class="ui-dialog-header {headerClass}">
					<Slot
						class="ui-dialog-title {titleClass}"
						render={title}
						payload={dialog}
						props={titleProps}
					/>
					<Slot
						class="ui-dialog-description {descriptionClass}"
						render={description}
						payload={dialog}
						props={descriptionProps}
					/>
					{#if closable}
						<Slot
							class="ui-dialog-close-button {closeButtonClass}"
							render={closeButton}
							payload={dialog}
							props={closeButtonProps}
						>
							<Button size="small" variant="ghost" onclick={dialog.close}>
								{@render theme.snippets.defaultCloseIcon?.({ size: 20 })}
							</Button>
						</Slot>
					{/if}
				</header>
			</Slot>
			{#if children}
				<div class="ui-dialog-content {contentClass}">
					{@render children?.({ payload: dialog })}
				</div>
			{/if}
			<Slot
				render={footer}
				class="ui-dialog-footer {footerClass}"
				payload={dialog}
				props={footerProps}
			/>
		</div>
	</dialog>
{/if}
<Slot render={trigger} payload={dialog} props={triggerProps} class={triggerClass} />
