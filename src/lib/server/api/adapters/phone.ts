// Tiny phone helper. Used by rpc-router to flag foreign customers when needed.
// Extracted from the (now removed) deposit-policy adapter — the API is the
// authoritative deposit-policy decision-maker, but this helper still has
// non-deposit uses.

export function isForeignPhone(phone: string | null | undefined): boolean {
	if (!phone) return false;
	return !phone.startsWith('+33');
}
