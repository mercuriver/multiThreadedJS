class RingBuffer {
  constructor(meta /*: Uint32Array[3] */, buffer /*: Uint8Array */) {
    this.meta = meta; // [head, tail, lenght]
    this.buffer = buffer;
  }

  get head() {
    return this.meta[0];
  }
  set head(n) {
    this.meta[0] = n;
  }

  get tail() {
    return this.meta[1];
  }
  set tail(n) {
    this.meta[1] = n;
  }

  get length() {
    return this.meta[2];
  }
  set length(n) {
    this.meta[2] = n;
  }

  write(data /*: Uint8Array */) {
    let bytesWritten = data.length;
    if (bytesWritten > this.buffer.length - this.length) {
      bytesWritten = this.buffer.length - this.length;
      data = data.subarray(0, bytesWritten);
    }

    if (bytesWritten === 0) {
      return bytesWritten;
    }

    if (
      (this.head >= this.tail &&
        this.buffer.length - this.head >= bytesWritten) ||
      (this.head < this.tail && bytesWritten <= this.tail - this.head)
    ) {
      this.buffer.set(data, this.head);
      this.head += bytesWritten;
    } else {
      // 데이터를 쓰기에 충분한 버퍼 사이즈가 확보되지 않은 경우
      // 데이터를 2개의 chunk로 나누어 버퍼에 입력
      const endSpaceAvailable = this.buffer.length - this.head;
      const endChunk = data.subarray(0, endSpaceAvailable);
      const beginChunk = data.subarray(endSpaceAvailable);
      this.buffer.set(endChunk, this.head);
      this.buffer.set(beginChunk, 0);
      this.head = beginChunk.length;
    }

    this.length += bytesWritten;
    return bytesWritten;
  }

  read(bytes) {
    if (bytes > this.length) {
      bytes = this.length;
    }
    if (bytes === 0) {
      return new Uint8Array(0);
    }
    let readData;
    if (this.head > this.tail || this.buffer.length - this.tail >= bytes) {
      readData = this.buffer.slice(this.tail, bytes);
      this.tail += bytes;
    } else {
      readData = new Uint8Array(bytes);
      const endBytesToRead = this.buffer.length - this.tail;
      readData.set(this.buffer.subarray(this.tail, this.buffer.length));
      readData.set(
        this.buffer.subarray(0, bytes - endBytesToRead),
        endBytesToRead
      );
      this.tail = bytes - endBytesToRead;
    }
    this.length -= bytes;
    return readData;
  }
}
