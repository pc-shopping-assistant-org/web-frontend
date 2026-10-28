import {
  IconApps,
  IconArmchair,
  IconComponents,
  IconCpu,
  IconDatabase,
  IconDesk,
  IconDeviceDesktop,
  IconDeviceComputerCamera,
  IconDeviceGamepad2,
  IconDeviceLaptop,
  IconDeviceMobile,
  IconDeviceSdCard,
  IconDeviceSpeaker,
  IconDeviceTv,
  IconDevicesPc,
  IconHeadphones,
  IconKeyboard,
  IconLayoutGrid,
  IconMicrophone,
  IconMouse,
  IconPackage,
  IconPlugConnected,
  IconRouter,
  IconServer2,
  IconWind,
} from "@tabler/icons-react";
import type {TablerIcon} from "@tabler/icons-react";
import {createElement, type ComponentPropsWithoutRef} from "react";

type CategoryIconRule = {
  keywords: string[];
  icon: TablerIcon;
};

const categoryIconRules: CategoryIconRule[] = [
  {keywords: ["laptop gaming", "gaming laptop"], icon: IconDeviceLaptop},
  {keywords: ["laptop"], icon: IconDeviceLaptop},
  {keywords: ["điện thoại", "phone", "mobile"], icon: IconDeviceMobile},
  {keywords: ["pc", "máy tính"], icon: IconDevicesPc},
  {keywords: ["desktop"], icon: IconDeviceDesktop},
  {keywords: ["main", "vga", "gpu"], icon: IconComponents},
  {keywords: ["cpu", "processor"], icon: IconCpu},
  {keywords: ["case"], icon: IconServer2},
  {keywords: ["nguồn", "psu"], icon: IconPlugConnected},
  {keywords: ["tản", "cooler"], icon: IconWind},
  {keywords: ["ổ cứng", "ssd", "hdd"], icon: IconDatabase},
  {keywords: ["ram", "thẻ nhớ", "sd"], icon: IconDeviceSdCard},
  {keywords: ["loa", "speaker"], icon: IconDeviceSpeaker},
  {keywords: ["micro"], icon: IconMicrophone},
  {keywords: ["webcam", "camera"], icon: IconDeviceComputerCamera},
  {keywords: ["màn hình", "monitor", "tv"], icon: IconDeviceTv},
  {keywords: ["bàn phím", "keyboard"], icon: IconKeyboard},
  {keywords: ["chuột", "mouse"], icon: IconMouse},
  {keywords: ["tai nghe", "headphone"], icon: IconHeadphones},
  {keywords: ["ghế", "chair"], icon: IconArmchair},
  {keywords: ["bàn", "desk"], icon: IconDesk},
  {keywords: ["phần mềm", "software"], icon: IconApps},
  {keywords: ["mạng", "router", "wifi"], icon: IconRouter},
  {keywords: ["phụ kiện", "accessory"], icon: IconPackage},
  {keywords: ["console", "game"], icon: IconDeviceGamepad2},
];

/** The icon of each hardware type code of the master table; a code not listed here falls back to the name guess. */
const hardwareTypeIcons: Record<string, TablerIcon> = {
  CPU: IconCpu,
  MAINBOARD: IconComponents,
  RAM: IconDeviceSdCard,
  GPU: IconComponents,
  PSU: IconPlugConnected,
  CASE: IconServer2,
  COOLER: IconWind,
  STORAGE: IconDatabase,
  SSD: IconDatabase,
  HDD: IconDatabase,
  MONITOR: IconDeviceTv,
  MOUSE: IconMouse,
  KEYBOARD: IconKeyboard,
  HEADSET: IconHeadphones,
  PREBUILT_PC: IconDevicesPc,
  PC_GAMING: IconDevicesPc,
  PC_WORKSTATION: IconDevicesPc,
  PC_OFFICE: IconDevicesPc,
  PC_AI: IconDevicesPc,
  PC_MINI: IconDevicesPc,
};

export function getCatalogCategoryIcon(categoryName?: string | null, hardwareType?: string | null): TablerIcon {
  const byType = hardwareType ? hardwareTypeIcons[hardwareType] : undefined;
  if (byType) return byType;
  const normalizedName = categoryName?.toLocaleLowerCase() ?? "";
  return categoryIconRules.find(({keywords}) => keywords.some((keyword) => normalizedName.includes(keyword)))?.icon ?? IconLayoutGrid;
}

export function CatalogCategoryIcon({
  categoryName,
  hardwareType,
  ...props
}: {categoryName?: string | null; hardwareType?: string | null} & ComponentPropsWithoutRef<"svg">) {
  const Icon = getCatalogCategoryIcon(categoryName, hardwareType);
  return createElement(Icon, {"aria-hidden": true, ...props});
}
