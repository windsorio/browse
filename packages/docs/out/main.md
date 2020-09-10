> This was generated using BrowseDoc which is still very much a work in progress

# Table of Contents

- [Scope: Math](#scope-Math)
  - [`E`](#E)
  - [`LN10`](#LN10)
  - [`LN2`](#LN2)
  - [`LOG10E`](#LOG10E)
  - [`LOG2E`](#LOG2E)
  - [`PI`](#PI)
  - [`SQRT1_2`](#SQRT1_2)
  - [`SQRT2`](#SQRT2)
  - [`acos x`](#acos-x)
  - [`acosh x y`](#acosh-x-y)
  - [`asin x`](#asin-x)
  - [`asinh x`](#asinh-x)
  - [`atan x`](#atan-x)
  - [`atanh x`](#atanh-x)
  - [`atan2 y x`](#atan2-y-x)
  - [`cbrt x`](#cbrt-x)
  - [`ceil x`](#ceil-x)
  - [`clz32 x`](#clz32-x)
  - [`cos x`](#cos-x)
  - [`cosh x`](#cosh-x)
  - [`exp x`](#exp-x)
  - [`expm1 x`](#expm1-x)
  - [`floor x`](#floor-x)
  - [`fround x`](#fround-x)
  - [`hypot x y`](#hypot-x-y)
  - [`imul x y`](#imul-x-y)
  - [`log x`](#log-x)
  - [`log1p x`](#log1p-x)
  - [`log10 x`](#log10-x)
  - [`log2 x`](#log2-x)
  - [`pow x y`](#pow-x-y)
  - [`random`](#random)
  - [`round x`](#round-x)
  - [`sign x`](#sign-x)
  - [`sin x`](#sin-x)
  - [`sinh x`](#sinh-x)
  - [`sqrt x`](#sqrt-x)
  - [`tan x`](#tan-x)
  - [`tanh x`](#tanh-x)
  - [`trunc x`](#trunc-x)

## Scope `Math`

Standard Math functions

### Rules

### `E`

@scope { Standard Math functions } @name { Math }
Euler's constant and the base of natural logarithms; approximately 2.718.

### `LN10`

Natural logarithm of 2; approximately 0.693.

### `LN2`

Natural logarithm of 10; approximately 2.303.

### `LOG10E`

Base-2 logarithm of E; approximately 1.443.

### `LOG2E`

Base-10 logarithm of E; approximately 0.434.

### `PI`

Ratio of the a circle's circumference to its diameter; approximately 3.14159.

### `SQRT1_2`

Square root of ½ (or equivalently, 1/√2); approximately 0.707.

### `SQRT2`

Square root of 2; approximately 1.414.

### `acos x`

- `x`

Returns the arccosine of x.

### `acosh x y`

- `x`
- `y`

Returns the hyperbolic arccosine of x.

### `asin x`

- `x`

Returns the arcsine of x.

### `asinh x`

- `x`

Returns the hyperbolic arcsine of a number.

### `atan x`

- `x`

Returns the arctangent of x.

### `atanh x`

- `x`

Returns the hyperbolic arctangent of x.

### `atan2 y x`

- `y`
- `x`

Returns the arctangent of the quotient of its arguments.

### `cbrt x`

- `x`

Returns the cube root of x.

### `ceil x`

- `x`

Returns the smallest integer greater than or equal to x.

### `clz32 x`

- `x`

Returns the number of leading zeroes of the 32-bit integer x.

### `cos x`

- `x`

Returns the cosine of x.

### `cosh x`

- `x`

Returns the hyperbolic cosine of x.

### `exp x`

- `x`

Returns E^x, where x is the argument, and E is Euler's constant (2.718…, the base of the natural logarithm).

### `expm1 x`

- `x`

Returns subtracting 1 from exp(x).

### `floor x`

- `x`

Returns the largest integer less than or equal to x.

### `fround x`

- `x`

Returns the nearest single precision float representation of x.

### `hypot x y`

- `x`
- `y`

Returns the square root of the sum of squares of both arguments. TODO: support more than 2 arguments, like in the JS native version

### `imul x y`

- `x`
- `y`

Returns the result of the 32-bit integer multiplication of x and y.

### `log x`

- `x`

Returns the natural logarithm (㏒e; also, ㏑) of x.

### `log1p x`

- `x`

Returns the natural logarithm (㏒e; also ㏑) of 1 + x for the number x.

### `log10 x`

- `x`

Returns the base-10 logarithm of x.

### `log2 x`

- `x`

Returns the base-2 logarithm of x.

### `pow x y`

- `x`
- `y`

Returns base x to the exponent power y (that is, xy).

### `random`

Returns a pseudo-random number between 0 and 1.

### `round x`

- `x`

Returns the value of the number x rounded to the nearest integer.

### `sign x`

- `x`

Returns the sign of the x, indicating whether x is positive, negative, or zero.

### `sin x`

- `x`

Returns the sine of x.

### `sinh x`

- `x`

Returns the hyperbolic sine of x.

### `sqrt x`

- `x`

Returns the positive square root of x.

### `tan x`

- `x`

Returns the tangent of x.

### `tanh x`

- `x`

Returns the hyperbolic tangent of x.

### `trunc x`

- `x`

Returns the integer portion of x, removing any fractional digits.
