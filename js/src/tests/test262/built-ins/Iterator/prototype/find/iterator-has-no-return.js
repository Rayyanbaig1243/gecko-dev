// |reftest| skip -- iterator-helpers is not supported
// Copyright (C) 2023 Michael Ficarra. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.find
description: >
  The underlying iterator is sometimes unable to be closed (has no return method)
info: |
  %Iterator.prototype%.find ( predicate )

features: [iterator-helpers]
flags: []
---*/
let iterator = [1, 2, 3, 4, 5][Symbol.iterator]();

assert.sameValue(iterator.return, undefined);

let ret = iterator.find(v => v > 3);

assert.sameValue(ret, 4);

let { done, value } = iterator.next();
assert.sameValue(done, false);
assert.sameValue(value, 5);

({ done, value } = iterator.next());
assert.sameValue(done, true);
assert.sameValue(value, undefined);

reportCompare(0, 0);
