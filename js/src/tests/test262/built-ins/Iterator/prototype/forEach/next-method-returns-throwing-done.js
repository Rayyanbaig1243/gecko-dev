// |reftest| skip -- iterator-helpers is not supported
// Copyright (C) 2023 Michael Ficarra. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.forEach
description: >
  Underlying iterator next returns object with throwing done getter
info: |
  %Iterator.prototype%.forEach ( fn )

features: [iterator-helpers]
flags: []
---*/
class ThrowingIterator extends Iterator {
  next() {
    return {
      get done() {
        throw new Test262Error();
      },
      value: 1,
    };
  }
  return() {
    throw new Error();
  }
}

let iterator = new ThrowingIterator();

assert.throws(Test262Error, function () {
  iterator.forEach(() => {});
});

reportCompare(0, 0);
