/**
 * Load Testing Script for Widget Reservations
 *
 * Simulates multiple customers making reservations through the widget API
 * Usage:
 *   tsx widget/scripts/load-test-reservations.ts
 *   tsx widget/scripts/load-test-reservations.ts --num 50 --date 2026-02-15
 *   tsx widget/scripts/load-test-reservations.ts --env production --restaurant-id PROD_ID --widget-id WIDGET_ID
 */

import { faker } from '@faker-js/faker';

interface LoadTestConfig {
	baseUrl: string;
	restaurantId: string;
	widgetId: string;
	numReservations: number;
	testDate: Date;
	paxRange: [number, number];
	concurrency: number;
	spreadDays: number; // Number of days to spread reservations across
}

interface RpcRequest {
	jsonrpc: '2.0';
	id: number;
	method: string;
	params: Record<string, any>;
}

interface RpcResponse {
	jsonrpc: '2.0';
	id: number;
	result?: any;
	error?: {
		code: number;
		message: string;
	};
}

interface Service {
	id: string;
	name: Array<{ language: string; value: string }>;
	startTime: number;
	endTime: number;
	minPaxPerReservation: number;
	maxPaxPerReservation: number;
}

interface Slot {
	date: string;
	state: 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';
	tableCount?: number;
}

interface BookingResult {
	status: 'OK' | 'REQUIRES_PAYMENT_INTENT' | 'ERROR';
	error?: string;
	reservationId?: string;
}

interface TestResult {
	attempted: number;
	successful: number;
	failed: number;
	skipped: number;
	errors: Array<{ reason: string; count: number }>;
	averageResponseTime: number;
	reservationIds: string[];
}

// Parse CLI arguments
function parseArgs(): Partial<LoadTestConfig> {
	const args = process.argv.slice(2);
	const config: Partial<LoadTestConfig> = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const nextArg = args[i + 1];

		switch (arg) {
			case '--num':
				config.numReservations = parseInt(nextArg, 10);
				i++;
				break;
			case '--date':
				config.testDate = new Date(nextArg);
				i++;
				break;
			case '--concurrency':
				config.concurrency = parseInt(nextArg, 10);
				i++;
				break;
			case '--spread-days':
				config.spreadDays = parseInt(nextArg, 10);
				i++;
				break;
			case '--base-url':
				config.baseUrl = nextArg;
				i++;
				break;
			case '--restaurant-id':
				config.restaurantId = nextArg;
				i++;
				break;
			case '--widget-id':
				config.widgetId = nextArg;
				i++;
				break;
			case '--env':
				if (nextArg === 'production') {
					config.baseUrl = 'https://widget.e-table.co';
				}
				i++;
				break;
		}
	}

	return config;
}

// Get default config
function getDefaultConfig(): LoadTestConfig {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);

	return {
		baseUrl: 'http://localhost:8987',
		restaurantId: 'TEST',
		widgetId: '01KG07HGTFGT265V165M6S3EQY',
		numReservations: 20,
		testDate: tomorrow,
		paxRange: [2, 6],
		concurrency: 5,
		spreadDays: 7 // Spread across 7 days by default
	};
}

// Make API call to widget
async function apiCall(
	config: LoadTestConfig,
	method: string,
	params: Record<string, any>
): Promise<any> {
	const url = `${config.baseUrl}/test-api`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-RESTO': config.restaurantId
		},
		body: JSON.stringify({ method, params })
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`HTTP ${response.status}: ${text}`);
	}

	const result = await response.json();

	if (!result.success) {
		throw new Error(result.error || 'API call failed');
	}

	return result.data;
}

// Generate fake customer data
function generateCustomerData() {
	return {
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		email: faker.internet.email(),
		phone: faker.helpers.fromRegExp(/\+33 [1-9] [0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}/),
		notes: Math.random() > 0.5 ? faker.lorem.sentence() : undefined
	};
}

// Get a random date within the spread range
function getRandomDate(startDate: Date, spreadDays: number): Date {
	const randomDayOffset = Math.floor(Math.random() * spreadDays);
	const date = new Date(startDate);
	date.setDate(date.getDate() + randomDayOffset);
	return date;
}

// Attempt to book a reservation
async function bookReservation(
	config: LoadTestConfig,
	reservationDate?: Date
): Promise<{ success: boolean; error?: string; reservationId?: string; responseTime: number }> {
	const startTime = Date.now();

	// Use provided date or randomly select a day within spread range
	const dateToUse = reservationDate || getRandomDate(config.testDate, config.spreadDays);

	try {
		// Step 1: Get available services
		const services: Service[] = await apiCall(config, 'getServices', {
			restaurantId: config.restaurantId,
			date: dateToUse.toISOString()
		});

		if (!services || services.length === 0) {
			return {
				success: false,
				error: 'No services available',
				responseTime: Date.now() - startTime
			};
		}

		// Step 2: Randomly select a service
		const service = services[Math.floor(Math.random() * services.length)];

		// Step 3: Randomly select PAX within constraints
		const minPax = Math.max(service.minPaxPerReservation, config.paxRange[0]);
		const maxPax = Math.min(service.maxPaxPerReservation, config.paxRange[1]);
		const pax = Math.floor(Math.random() * (maxPax - minPax + 1)) + minPax;

		// Step 4: Get available slots
		const slots: Slot[] = await apiCall(config, 'getServiceSlots', {
			restaurantId: config.restaurantId,
			serviceId: service.id,
			pax,
			date: dateToUse.toISOString()
		});

		// Step 5: Filter for available slots only
		const availableSlots = slots.filter(
			(slot) => slot.state === 'AVAILABLE' || slot.state === 'ALMOST_FULL'
		);

		if (availableSlots.length === 0) {
			return {
				success: false,
				error: 'No available slots',
				responseTime: Date.now() - startTime
			};
		}

		// Step 6: Randomly select a slot
		const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

		// Step 7: Generate customer data
		const customer = generateCustomerData();

		// Step 8: Book the reservation
		const bookingResult: BookingResult = await apiCall(config, 'book', {
			reservation: {
				restaurantId: config.restaurantId,
				serviceId: service.id,
				pax,
				date: new Date(slot.date).toISOString(),
				notes: customer.notes,
				contact: {
					firstName: customer.firstName,
					lastName: customer.lastName,
					phone: customer.phone,
					email: customer.email
				}
			}
		});

		if (bookingResult.status === 'OK') {
			return {
				success: true,
				reservationId: bookingResult.reservationId,
				responseTime: Date.now() - startTime
			};
		} else if (bookingResult.status === 'REQUIRES_PAYMENT_INTENT') {
			return {
				success: false,
				error: 'Payment required (not implemented in script)',
				responseTime: Date.now() - startTime
			};
		} else if (bookingResult.status === 'NO_TABLE_AVAILABLE') {
			return {
				success: false,
				error: 'No table available for this slot',
				responseTime: Date.now() - startTime
			};
		} else {
			return {
				success: false,
				error: bookingResult.error || `Booking failed: ${bookingResult.status}`,
				responseTime: Date.now() - startTime
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
		console.error('Caught error:', error);
		return {
			success: false,
			error: errorMessage || 'Unknown booking error',
			responseTime: Date.now() - startTime
		};
	}
}

// Retry logic
async function bookWithRetry(
	config: LoadTestConfig,
	maxRetries = 3
): Promise<{ success: boolean; error?: string; reservationId?: string; responseTime: number }> {
	let lastError = '';
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		const result = await bookReservation(config);

		if (result.success) {
			return result;
		}

		lastError = result.error || '';

		// Print first error for debugging
		if (attempt === 1) {
			console.error(`\n❌ Error: ${lastError}`);
		}

		// Don't retry if no slots available, no table available, or payment required
		if (
			result.error?.includes('No available slots') ||
			result.error?.includes('No table available') ||
			result.error?.includes('Payment required')
		) {
			return result;
		}

		// Wait before retry (exponential backoff)
		if (attempt < maxRetries) {
			await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
		}
	}

	return {
		success: false,
		error: lastError || 'Max retries exceeded',
		responseTime: 0
	};
}

// Process a batch of reservations
async function processBatch(config: LoadTestConfig, batchSize: number): Promise<TestResult> {
	const result: TestResult = {
		attempted: batchSize,
		successful: 0,
		failed: 0,
		skipped: 0,
		errors: [],
		averageResponseTime: 0,
		reservationIds: []
	};

	const promises = [];
	for (let i = 0; i < batchSize; i++) {
		promises.push(bookWithRetry(config));
	}

	const results = await Promise.all(promises);

	let totalResponseTime = 0;
	const errorCounts = new Map<string, number>();

	for (const res of results) {
		totalResponseTime += res.responseTime;

		if (res.success) {
			result.successful++;
			if (res.reservationId) {
				result.reservationIds.push(res.reservationId);
			}
		} else if (res.error?.includes('No available slots') || res.error?.includes('No table available')) {
			result.skipped++;
			const errorKey = res.error || 'Unknown error';
			errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
		} else {
			result.failed++;
			const errorKey = res.error || 'Unknown error';
			errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
		}
	}

	result.averageResponseTime = totalResponseTime / batchSize;
	result.errors = Array.from(errorCounts.entries()).map(([reason, count]) => ({
		reason,
		count
	}));

	return result;
}

// Main execution
async function main() {
	const cliConfig = parseArgs();
	const config: LoadTestConfig = { ...getDefaultConfig(), ...cliConfig };

	console.log('🚀 Load Testing Widget Reservations\n');
	console.log('Configuration:');
	console.log(`  Base URL: ${config.baseUrl}`);
	console.log(`  Restaurant ID: ${config.restaurantId}`);
	console.log(`  Widget ID: ${config.widgetId}`);
	console.log(`  Start Date: ${config.testDate.toISOString().split('T')[0]}`);
	console.log(`  Spread Across: ${config.spreadDays} days`);
	console.log(`  Reservations: ${config.numReservations}`);
	console.log(`  PAX Range: ${config.paxRange[0]}-${config.paxRange[1]}`);
	console.log(`  Concurrency: ${config.concurrency}\n`);

	const startTime = Date.now();

	// Process in batches
	const totalResult: TestResult = {
		attempted: 0,
		successful: 0,
		failed: 0,
		skipped: 0,
		errors: [],
		averageResponseTime: 0,
		reservationIds: []
	};

	let processed = 0;
	const totalBatches = Math.ceil(config.numReservations / config.concurrency);

	for (let batch = 0; batch < totalBatches; batch++) {
		const batchSize = Math.min(config.concurrency, config.numReservations - processed);

		process.stdout.write(
			`\r📊 Progress: ${processed}/${config.numReservations} reservations (${Math.round(
				(processed / config.numReservations) * 100
			)}%)`
		);

		const batchResult = await processBatch(config, batchSize);

		totalResult.attempted += batchResult.attempted;
		totalResult.successful += batchResult.successful;
		totalResult.failed += batchResult.failed;
		totalResult.skipped += batchResult.skipped;
		totalResult.reservationIds.push(...batchResult.reservationIds);

		// Merge errors
		for (const error of batchResult.errors) {
			const existing = totalResult.errors.find((e) => e.reason === error.reason);
			if (existing) {
				existing.count += error.count;
			} else {
				totalResult.errors.push(error);
			}
		}

		totalResult.averageResponseTime =
			(totalResult.averageResponseTime * processed + batchResult.averageResponseTime * batchSize) /
			(processed + batchSize);

		processed += batchSize;
	}

	const totalTime = (Date.now() - startTime) / 1000;

	console.log('\n\n✅ Load Test Complete!\n');
	console.log('Results:');
	console.log(`  Total Attempted: ${totalResult.attempted}`);
	console.log(`  ✅ Successful: ${totalResult.successful}`);
	console.log(`  ❌ Failed: ${totalResult.failed}`);
	console.log(`  ⏭️  Skipped (no capacity/slots): ${totalResult.skipped}`);
	console.log(`  ⏱️  Average Response Time: ${Math.round(totalResult.averageResponseTime)}ms`);
	console.log(`  🕐 Total Time: ${totalTime.toFixed(2)}s`);
	console.log(`  📈 Throughput: ${(totalResult.attempted / totalTime).toFixed(2)} requests/sec\n`);

	if (totalResult.errors.length > 0) {
		console.log('Errors:');
		for (const error of totalResult.errors) {
			console.log(`  - ${error.reason}: ${error.count} occurrences`);
		}
		console.log('');
	}

	if (totalResult.reservationIds.length > 0) {
		console.log('Sample Reservation IDs (first 5):');
		for (const id of totalResult.reservationIds.slice(0, 5)) {
			console.log(`  - ${id}`);
		}
		console.log('');
	}

	console.log('💡 Verify reservations in database:');
	console.log('   pnpm inspect:db');
	console.log('   Then check the Reservation table\n');
}

// Run the script
main().catch((error) => {
	console.error('❌ Fatal Error:', error);
	process.exit(1);
});
