// Minimal shim for next-flight-client-entry-loader used in some Next builds
// This shim exports a function that returns the input unchanged. It's sufficient
// for setups that don't rely on the loader's special behavior (RSC flight entries).

module.exports = function nextFlightClientEntryLoader(content) {
  return content;
};
