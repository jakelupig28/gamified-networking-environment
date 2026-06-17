import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth']
};

export default nextConfig;
