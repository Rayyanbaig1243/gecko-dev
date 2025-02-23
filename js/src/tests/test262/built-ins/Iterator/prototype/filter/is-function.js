// |reftest| skip -- iterator-helpers is not supported
// Copyright (C) 2020 Rick Waldron. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.filter
description: >
  Iterator.prototype.filter is a built-in function
features: [iterator-helpers]
---*/

assert.sameValue(typeof Iterator.prototype.filter, 'function');

reportCompare(0, 0);
