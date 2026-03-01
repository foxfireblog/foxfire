import Image from "next/image";

interface ExplorationHeaderProps {
  imageSrc: string;
  imageAlt: string;
}

export function ExplorationHeader({ imageSrc, imageAlt }: ExplorationHeaderProps) {
  return (
    <div className="fade-up relative mb-10 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
    </div>
  );
}
