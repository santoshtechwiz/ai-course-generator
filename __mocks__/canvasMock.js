const jest = require("jest")

module.exports = {
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      measureText: jest.fn(() => ({
        width: 0,
        height: 0,
      })),
      fillText: jest.fn(),
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(0),
      })),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
    })),
    toDataURL: jest.fn(() => ""),
    toBuffer: jest.fn(() => Buffer.from([])),
    width: 0,
    height: 0,
  })),
  loadImage: jest.fn(() =>
    Promise.resolve({
      width: 0,
      height: 0,
    }),
  ),
}
