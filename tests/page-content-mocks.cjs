const React = require('react');
// Existing unit harnesses isolate their subject from page publishing/Firebase.
exports.content = {
  PageContent: ({ children }) => children,
  PageText: ({ fallback }) => fallback,
  PageImage: ({ scope, ...props }) => React.createElement('img', props),
  PageLink: ({ scope, ...props }) => React.createElement('a', props),
};
exports.build = { buildPage: () => ({ values: {}, seoTitle: '', seoDescription: '', images: [], revision: 0 }), withPageMetadata: (_, metadata) => metadata };
