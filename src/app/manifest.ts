import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unique Dispatch - Freight Dispatch & Amazon Relay",
    short_name: "Unique Dispatch",
    description:
      "Professional US Truck Dispatching, Rate Negotiation, and Amazon Relay Middle-Mile Management.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1128",
    theme_color: "#ea580c",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
