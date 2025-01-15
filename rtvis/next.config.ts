module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/embeddings",
        destination: "http://localhost:8000/api/embeddings",
      },
    ];
  },
};
