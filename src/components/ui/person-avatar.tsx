"use client";

import Image from "next/image";
import {useState} from "react";

/** The picture of a person, or the first letter of the first name while there is none, or when the picture cannot be loaded. */
export function PersonAvatar({person, className = "size-12"}: {person: {avatarUrl?: string; firstName: string}; className?: string}) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const showImage = person.avatarUrl && person.avatarUrl !== failedUrl;
  return <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary ${className}`}>
    {showImage
      ? <Image src={person.avatarUrl!} alt="" fill sizes="96px" unoptimized className="object-cover" onError={() => setFailedUrl(person.avatarUrl)} />
      : <span aria-hidden="true">{person.firstName.charAt(0).toUpperCase()}</span>}
  </span>;
}
