// Pure TS port of the API's domain `resolve_deposit_policy`. Used widget-side
// only for informational gating (e.g. when to mount the card form). The API is
// the authoritative decision-maker; this is a local mirror for UX.
//
// Source of truth: api/src/domain/service/deposit_policy.rs

export type ResolvedDepositPolicy = {
	required: boolean;
	amountCents: number;
	isForeignPath: boolean;
};

type ShiftBaselineInput = {
	captureEnabled: boolean;
	captureAmountPerPax: number;
	captureThreshold: number;
	foreignCaptureEnabled: boolean;
	foreignCaptureAmountPerPax: number;
};

type SlotOverrides = {
	captureEnabled?: boolean | null;
	captureAmountPerPax?: number | null;
	captureThreshold?: number | null;
	foreignCaptureEnabled?: boolean | null;
	foreignCaptureAmountPerPax?: number | null;
};

function applySlotOverrides(baseline: ShiftBaselineInput, slot: SlotOverrides): ShiftBaselineInput {
	return {
		captureEnabled: slot.captureEnabled ?? baseline.captureEnabled,
		captureAmountPerPax: slot.captureAmountPerPax ?? baseline.captureAmountPerPax,
		captureThreshold: slot.captureThreshold ?? baseline.captureThreshold,
		foreignCaptureEnabled: slot.foreignCaptureEnabled ?? baseline.foreignCaptureEnabled,
		foreignCaptureAmountPerPax:
			slot.foreignCaptureAmountPerPax ?? baseline.foreignCaptureAmountPerPax
	};
}

export function resolveDepositPolicy(args: {
	shiftCaptureEnabled: boolean;
	shiftCaptureAmountPerPax: number;
	shiftCaptureThreshold: number;
	shiftForeignCaptureEnabled: boolean;
	shiftForeignCaptureAmountPerPax: number;
	slot: SlotOverrides;
	pax: number;
	isForeign: boolean;
}): ResolvedDepositPolicy {
	const baseline: ShiftBaselineInput = {
		captureEnabled: args.shiftCaptureEnabled,
		captureAmountPerPax: args.shiftCaptureAmountPerPax,
		captureThreshold: args.shiftCaptureThreshold,
		foreignCaptureEnabled: args.shiftForeignCaptureEnabled,
		foreignCaptureAmountPerPax: args.shiftForeignCaptureAmountPerPax
	};
	const resolved = applySlotOverrides(baseline, args.slot);

	if (args.isForeign && resolved.foreignCaptureEnabled) {
		const amountCents = resolved.foreignCaptureAmountPerPax * args.pax;
		return {
			required: amountCents > 0,
			amountCents,
			isForeignPath: true
		};
	}

	if (resolved.captureEnabled && args.pax >= resolved.captureThreshold) {
		const amountCents = resolved.captureAmountPerPax * args.pax;
		return {
			required: amountCents > 0,
			amountCents,
			isForeignPath: false
		};
	}

	return { required: false, amountCents: 0, isForeignPath: false };
}

export function isForeignPhone(phoneE164: string | undefined | null): boolean {
	if (!phoneE164) return false;
	return !phoneE164.startsWith('+33');
}
