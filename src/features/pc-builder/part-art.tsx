"use client";

import {
  IconCpu,
  IconCircuitResistor,
  IconDeviceSdCard,
  IconDeviceDesktop,
  IconBolt,
  IconBox,
  IconWindmill,
  IconServer,
  IconMouse,
  IconKeyboard,
  IconHeadphones,
} from "@tabler/icons-react";
import {useState} from "react";
import type {Slot} from "./contracts";

const icons = {
  CPU: IconCpu,
  MAINBOARD: IconCircuitResistor,
  RAM: IconServer,
  GPU: IconDeviceDesktop,
  SSD: IconDeviceSdCard,
  PSU: IconBolt,
  CASE: IconBox,
  COOLER: IconWindmill,
  MONITOR: IconDeviceDesktop,
  MOUSE: IconMouse,
  KEYBOARD: IconKeyboard,
  HEADSET: IconHeadphones,
};

export function PartArt({
  slot,
  compact = false,
  fill = false,
  imageUrl,
  alt,
}: {
  slot: Slot;
  compact?: boolean;
  /** Fills the box it sits in, for picker cards that size the box themselves. */
  fill?: boolean;
  imageUrl?: string;
  alt?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const Icon = icons[slot];

  if (imageUrl && !imgError) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-white p-2 ${
          fill ? "size-full" : compact ? "size-11 shrink-0" : "h-40 w-full"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt || slot}
          className="size-full object-contain"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 dark:from-slate-900 dark:to-blue-950 ${fill ? "size-full" : compact ? "size-11 shrink-0" : "h-40 w-full"}`}
    >
      <div className={`absolute rounded-full border border-blue-300/30 ${fill ? "size-20" : compact ? "size-9" : "size-32"}`} />
      <Icon stroke={1.2} className={`relative text-slate-700 drop-shadow-sm dark:text-slate-300 ${fill ? "size-14" : compact ? "size-8" : "size-24"}`} />
      {!compact && !fill && <span className="absolute bottom-3 right-3 font-mono text-xs tracking-widest text-slate-500">{slot}</span>}
    </div>
  );
}
