"use client";

interface NavigateButtonProps {
  address: string;
  className?: string;
}

export function NavigateButton({ address, className }: NavigateButtonProps) {
  const encodedAddress = encodeURIComponent(address);

  function handleNavigate() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${encodedAddress}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank");
    }
  }

  return (
    <button
      onClick={handleNavigate}
      className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${className || ""}`}
    >
      Navigate
    </button>
  );
}
