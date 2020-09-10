> This was generated using BrowseDoc which is still very much a work in progress

# Table of Contents

- [Scope: DateTime](#scope-DateTime)
  - [`SECONDS_PER_MINUTE`](#SECONDS_PER_MINUTE)
  - [`MINUTES_PER_HOUR`](#MINUTES_PER_HOUR)
  - [`HOURS_PER_DAY`](#HOURS_PER_DAY)
  - [`DAYS_PER_WEEK`](#DAYS_PER_WEEK)
  - [`SECOND`](#SECOND)
  - [`MINUTE`](#MINUTE)
  - [`HOUR`](#HOUR)
  - [`DAY`](#DAY)
  - [`WEEK`](#WEEK)
  - [`getDay date`](#getDay-date)
  - [`getFullYear date`](#getFullYear-date)
  - [`getHours date`](#getHours-date)
  - [`getMilliseconds date`](#getMilliseconds-date)
  - [`getMinutes date`](#getMinutes-date)
  - [`getMonth date`](#getMonth-date)
  - [`getSeconds date`](#getSeconds-date)
  - [`getTime date`](#getTime-date)
  - [`getTimezoneOffset date`](#getTimezoneOffset-date)
  - [`getUTCDate date`](#getUTCDate-date)
  - [`getUTCDay date`](#getUTCDay-date)
  - [`getUTCFullYear date`](#getUTCFullYear-date)
  - [`getUTCHours date`](#getUTCHours-date)
  - [`getUTCMilliseconds date`](#getUTCMilliseconds-date)
  - [`getUTCMinutes date`](#getUTCMinutes-date)
  - [`getUTCMonth date`](#getUTCMonth-date)
  - [`getUTCSeconds date`](#getUTCSeconds-date)
  - [`toDateString date`](#toDateString-date)
  - [`toISOString date`](#toISOString-date)
  - [`toLocaleDateString date tz`](#toLocaleDateString-date-tz)
  - [`toLocaleString date tz`](#toLocaleString-date-tz)
  - [`toLocaleTimeString date tz`](#toLocaleTimeString-date-tz)
  - [`toString date`](#toString-date)
  - [`toTimeString date`](#toTimeString-date)
  - [`toUTCString date`](#toUTCString-date)
  - [`valueOf date`](#valueOf-date)
  - [`dayOfYear date`](#dayOfYear-date)

## Scope `DateTime`

DateTime utilities

## Variables

### `SECONDS_PER_MINUTE`

Number of seconds in a minute

### `MINUTES_PER_HOUR`

Number of minutes in an hour

### `HOURS_PER_DAY`

Number of hours in a day

### `DAYS_PER_WEEK`

Number of days in a week

### `SECOND`

Number of milliseconds in a second

### `MINUTE`

Number of milliseconds in a minute

### `HOUR`

Number of milliseconds in an hour

### `DAY`

Number of milliseconds in a day

### `WEEK`

Number of milliseconds in a week

## Rules

### `getDay date`

Returns the day of the week (0–6) for the specified date according to local time.

### `getFullYear date`

Returns the day of the week (0–6) for the specified date according to local time.

### `getHours date`

Returns the hour (0–23) in the specified date according to local time.

### `getMilliseconds date`

Returns the milliseconds (0–999) in the specified date according to local time.

### `getMinutes date`

Returns the minutes (0–59) in the specified date according to local time.

### `getMonth date`

Returns the month (0–11) in the specified date according to local time.

### `getSeconds date`

Returns the seconds (0–59) in the specified date according to local time.

### `getTime date`

Returns the numeric value of the specified date as the number of milliseconds since January 1, 1970, 00:00:00 UTC. (Negative values are returned for prior times.)

### `getTimezoneOffset date`

Returns the time-zone offset in minutes for the current locale.

### `getUTCDate date`

Returns the day (date) of the month (1–31) in the specified date according to universal time.

### `getUTCDay date`

Returns the day of the week (0–6) in the specified date according to universal time.

### `getUTCFullYear date`

Returns the year (4 digits for 4-digit years) in the specified date according to universal time.

### `getUTCHours date`

Returns the hours (0–23) in the specified date according to universal time.

### `getUTCMilliseconds date`

Returns the milliseconds (0–999) in the specified date according to universal time.

### `getUTCMinutes date`

Returns the minutes (0–59) in the specified date according to universal time.

### `getUTCMonth date`

Returns the month (0–11) in the specified date according to universal time.

### `getUTCSeconds date`

Returns the seconds (0–59) in the specified date according to universal time.

### `toDateString date`

Returns the "date" portion of the Date as a human-readable string like 'Thu Apr 12 2018'.

### `toISOString date`

Converts a date to a string following the ISO 8601 Extended Format.

### `toLocaleDateString date tz`

Returns a string with a locality sensitive representation of the date portion of this date based on system settings.

### `toLocaleString date tz`

Returns a string with a locality-sensitive representation of this date

### `toLocaleTimeString date tz`

Returns a string with a locality-sensitive representation of the time portion of this date, based on system settings.

### `toString date`

Returns a string representing the specified Date object

### `toTimeString date`

Returns the "time" portion of the Date as a human-readable string.

### `toUTCString date`

Converts a date to a string using the UTC timezone.

### `valueOf date`

Returns the primitive value of a Date object

### `dayOfYear date`

Get number of the day in the year @return Number of the day in year
