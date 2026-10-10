"use client";

import Image from "next/image";
import {useState} from "react";

import type {Employee} from "../models";

/** The picture of an employee, or the first letter of the name while there is none, or when the picture cannot be loaded. */
export function EmployeeAvatar({employee, className = "size-12"}: {employee: Pick<Employee, "avatarUrl" | "firstName">; className?: string}) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const showImage = employee.avatarUrl && employee.avatarUrl !== failedUrl;
  return <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary ${className}`}>
    {showImage
      ? <Image src={employee.avatarUrl!} alt="" fill sizes="96px" unoptimized className="object-cover" onError={() => setFailedUrl(employee.avatarUrl)} />
      : <span aria-hidden="true">{employee.firstName.charAt(0).toUpperCase()}</span>}
  </span>;
}
