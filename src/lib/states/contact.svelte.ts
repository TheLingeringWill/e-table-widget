import { browser } from '$app/environment';
import { onMount, untrack } from 'svelte';

export const contact: {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	comments: string;
	notes: string;
} = $state({
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	comments: '',
	notes: ''
});

export const rememberMe: { checked: boolean } = $state({ checked: false });
export const prefilled: { value: boolean } = $state({ value: false });

export function isForeign(): boolean {
	const phone = contact.phone;
	if (!phone) return false;
	return !phone.startsWith('+33');
}

// $effect(() => {
// 	console.log('contact', contact);

// 	if (browser) {
// 		loca
// 	}
// 	// contact;

// 	// untrack(() => {
// 	// 	if (browser) {
// 	// 		const contact = localStorage.getItem('contact');
// 	// 		if (contact) {
// 	// 			const parsedContact = JSON.parse(contact);
// 	// 			contact.firstName = parsedContact.firstName;
// 	// 			contact.lastName = parsedContact.lastName;
// 	// 			contact.email = parsedContact.email;
// 	// 			contact.phone = parsedContact.phone;
// 	// 			contact.comments = parsedContact.comments;
// 	// 		}
// 	// 	}
// 	// });
// });

// export const contact = writable<{
// 	firstName: string;
// 	lastName: string;
// 	email: string;
// 	phone: string;
// 	comments: string;
// }>(
// 	browser
// 		? JSON.parse(
// 				localStorage.getItem('contact') ||
// 					"{firstName: '',lastName: '',email: '',phone: '',comments: ''}"
// 			)
// 		: {
// 				firstName: '',
// 				lastName: '',
// 				email: '',
// 				phone: '',
// 				comments: ''
// 			}
// );

// contact.subscribe((value) => {
// 	if (browser) {
// 		localStorage.setItem('contact', JSON.stringify(contact));
// 	}
// });
