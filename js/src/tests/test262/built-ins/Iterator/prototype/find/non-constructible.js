// |reftest| skip -- iterator-helpers is not supported
// Copyright (C) 2020 Rick Waldron. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.find
description: >
  Iterator.prototype.find is not constructible.

  Built-in function objects that are not identified as constructors do not implement the [[Construct]] internal method unless otherwise specified in the description of a particular function.
features: [iterator-helpers]
---*/
function* g() {}
let iter = g();

assert.throws(TypeError, () => {
  new iter.find();
});

assert.throws(TypeError, () => {
  new iter.find(() => {});
});

assert.throws(TypeError, () => {
  new Iterator.prototype.find(() => {});
});

assert.throws(TypeError, () => {
  new class extends Iterator {}.find(() => {});
});

reportCompare(0, 0);
