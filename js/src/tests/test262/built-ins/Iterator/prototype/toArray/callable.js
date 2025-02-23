// |reftest| skip -- iterator-helpers is not supported
// Copyright (C) 2020 Rick Waldron. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.toArray
description: >
  Iterator.prototype.toArray is callable
features: [iterator-helpers]
---*/
function* g() {}
Iterator.prototype.toArray.call(g());

let iter = g();
iter.toArray();

reportCompare(0, 0);
