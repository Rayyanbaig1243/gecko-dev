// |reftest| skip -- iterator-helpers is not supported
// Copyright (C) 2020 Rick Waldron. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-iterator-constructor
description: >
  Iterator has a "length" property whose value is 0.
info: |
  The Iterator Constructor

  The length property of the Iterator constructor function is 0.
  ...

  ES7 section 17: Unless otherwise specified, the length property of a built-in
  Function object has the attributes { [[Writable]]: false, [[Enumerable]]:
  false, [[Configurable]]: true }.
features: [iterator-helpers]
includes: [propertyHelper.js]
---*/

verifyProperty(Iterator, 'length', {
  value: 0,
  writable: false,
  enumerable: false,
  configurable: true,
});

reportCompare(0, 0);
