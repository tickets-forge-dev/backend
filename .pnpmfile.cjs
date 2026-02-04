function readPackage(pkg) {
  if (pkg.name === '@mastra/core') {
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['p-map'] = '^4.0.0';
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
