// https://stackoverflow.com/a/12504061/11651419

class StringIdGenerator {
    constructor(chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-') {
        this._chars = chars;
        this._nextId = [0];
    }
  
    next() {
        const r = [];
        for (const char of this._nextId) {
            r.unshift(this._chars[char]);
        }
        this._increment();
        return r.join('');
    }
  
    _increment() {
        for (let i = 0; i < this._nextId.length; i++) {
            const val = ++this._nextId[i];
            if (val >= this._chars.length) {
                this._nextId[i] = 0;
            } else {
                return;
            }
        }
        this._nextId.push(0);
    }
  
    *[Symbol.iterator]() {
        while (true) {
            yield this.next();
        }
    }
}

module.exports = StringIdGenerator;
