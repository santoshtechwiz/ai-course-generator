// Shim to provide named exports expected by @langchain/core
const pkg = require('js-tiktoken/dist/lite.cjs');
module.exports = {
  Tiktoken: pkg.Tiktoken,
  getEncodingNameForModel: pkg.getEncodingNameForModel,
};
