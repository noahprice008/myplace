export type ShareTarget = {
  id: string;
  label: string;
  build: (text: string, url: string) => string;
};

export const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "facebook",
    label: "Facebook",
    build: (text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: "x",
    label: "X (Twitter)",
    build: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    build: (text, url) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    build: (text, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    build: (_text, url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "email",
    label: "Email",
    build: (text, url) =>
      `mailto:?subject=${encodeURIComponent("From myplace")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export const shareUrl = () =>
  typeof window === "undefined" ? "https://myplacebeta.lovable.app" : window.location.origin;

export function openShareWindow(href: string) {
  if (typeof window === "undefined") return;
  window.open(href, "_blank", "noopener,noreferrer,width=640,height=640");
}

export function canNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
