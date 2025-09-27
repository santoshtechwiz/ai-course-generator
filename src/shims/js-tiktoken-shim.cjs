// Shim to provide named exports expected by @langchain/core
const pkg = require('js-tiktoken/lite');
module.exports = {
  Tiktoken: pkg.Tiktoken,
  getEncodingNameForModel: pkg.getEncodingNameForModel,
};
