# Load Testing Scripts

## Reservation Load Test

Create many test reservations via HTTP to the widget API. Works on both local and production.

### Usage

```bash
# Local: 20 reservations spread across 7 days starting tomorrow
pnpm --dir widget run load-test

# Custom number of reservations
pnpm --dir widget run load-test -- --num 100

# Spread across more days to avoid slot conflicts
pnpm --dir widget run load-test -- --num 200 --spread-days 30

# Specific start date
pnpm --dir widget run load-test -- --date 2026-02-15

# Full configuration
pnpm --dir widget run load-test -- --num 100 --date 2026-03-01 --spread-days 14 --concurrency 10

# Production: requires --env production with restaurant/widget IDs
pnpm --dir widget run load-test -- --env production --restaurant-id RESTAURANT_ID --widget-id WIDGET_ID
```

### Options

- `--num` - Number of reservations to create (default: 20)
- `--date` - Start date in YYYY-MM-DD format (default: tomorrow)
- `--spread-days` - Number of days to spread reservations across (default: 7)
- `--concurrency` - Parallel requests (default: 5)
- `--env` - Environment: `production` uses `https://widget.e-table.co` (default: local)
- `--base-url` - Widget URL (default: http://localhost:8987)
- `--restaurant-id` - Restaurant ID (default: TEST)
- `--widget-id` - Widget ID (required for production)

### Features

- ✅ Automatically spreads reservations across multiple days to avoid slot exhaustion
- ✅ Generates realistic customer data (names, emails, phone numbers)
- ✅ Randomly selects services, times, and party sizes
- ✅ Handles errors gracefully (retries, skips when full)
- ✅ Detailed progress reporting and statistics
- ✅ Configurable concurrency for performance testing

### Output

```
🚀 Load Testing Widget Reservations

Configuration:
  Base URL: http://localhost:8987
  Restaurant ID: TEST
  Start Date: 2026-01-29
  Spread Across: 14 days
  Reservations: 100
  PAX Range: 2-6
  Concurrency: 5

📊 Progress: 95/100 reservations (95%)

✅ Load Test Complete!

Results:
  Total Attempted: 100
  ✅ Successful: 92
  ❌ Failed: 8
  ⏭️  Skipped (no slots): 0
  ⏱️  Average Response Time: 537ms
  🕐 Total Time: 31.98s
  📈 Throughput: 3.13 requests/sec
```

### Tips

**Before running:**

- Make sure the widget dev server is running: `pnpm --filter widget dev`
- Make sure the database is seeded: `pnpm seed:db`

**If reservations fail:**

- Clear existing reservations:
  ```bash
  echo "DELETE FROM \"Reservation\" WHERE \"restaurantId\" = 'TEST' AND \"startDate\" >= '2026-01-28';" | \
    docker exec -i e-table-db-1 psql -U postgres -d cooking
  ```
- Increase `--spread-days` to distribute load across more days
- Use a future `--date` to avoid conflicts with existing reservations

**Verify results:**

```bash
# Check total count
echo "SELECT COUNT(*) FROM \"Reservation\" WHERE \"restaurantId\" = 'TEST';" | \
  docker exec -i e-table-db-1 psql -U postgres -d cooking

# Check distribution by date
echo "SELECT DATE(\"startDate\"), COUNT(*) FROM \"Reservation\" WHERE \"restaurantId\" = 'TEST' GROUP BY DATE(\"startDate\") ORDER BY DATE(\"startDate\");" | \
  docker exec -i e-table-db-1 psql -U postgres -d cooking
```
