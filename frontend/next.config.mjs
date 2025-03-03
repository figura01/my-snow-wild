/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      'localhost',
      'http://localhost:6100',
      'http://localhost:6100/uploads'
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "6100",
        pathname: "/uploads/*",
      },
    ]
  }, 

  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "http",
  //       hostname: "localhost",
  //       port: "8000",
  //       pathname: "/avatar/*",
  //     },
  //     {
  //       protocol: "https",
  //       hostname: "www.santelog.com",
  //       port: "",
  //       pathname: "/**",
  //     },
  //   ],
  // },
  distDir: "build",
};

export default nextConfig;