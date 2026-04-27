export const reservation: {
	id: string | undefined;
	serviceId: string | undefined;
	startDate: Date | undefined;
	pax: number | undefined;
	notes: string | undefined;
} = $state({
	id: undefined,
	serviceId: undefined,
	startDate: undefined,
	pax: undefined,
	notes: undefined
});

export const resetReservation = () => {
	reservation.id = undefined;
	reservation.serviceId = undefined;
	reservation.startDate = undefined;
	reservation.pax = undefined;
	reservation.notes = undefined;
};

export const reservationTemp: {
	id: string | null;
	serviceId: string | null;
	startDate: Date | null;
	pax: number | null;
	notes: string | null;
} = $state({
	id: null,
	serviceId: null,
	startDate: null,
	pax: null,
	notes: null
});
