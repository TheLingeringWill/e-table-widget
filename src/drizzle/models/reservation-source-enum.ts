import { pgEnum } from 'drizzle-orm/pg-core';

export const reservationSourceEnum = pgEnum('RESERVATION_SOURCE', ['WEB', 'WIDGET', 'VOICEMAIL', 'MESSENGER', 'THEFORK', 'INSTAGRAM', 'API', 'ADMIN', 'APP', 'EMAIL', 'SMS', 'PHONE', 'PASSINGBY', 'OTHER']);