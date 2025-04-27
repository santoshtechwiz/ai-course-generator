module.exports = {
  motion: {
    div: require("react").forwardRef((props, ref) => {
      const { children, ...rest } = props
      return require("react").createElement("div", { ...rest, ref }, children)
    }),
  },
  AnimatePresence: ({ children }) => children,
}
