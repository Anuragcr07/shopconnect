// open-next.config.ts
const config = {
  default: {
    deployment: {
      // This tells the bundler not to create the image optimization function
      imageOptimization: false,
    },
  },
};

export default config;