import Image, { type ImageProps } from "next/image";

type CardImageProps = Omit<ImageProps, "alt"> & { alt: string };

export function CardImage(props: CardImageProps) {
  return <Image {...props} alt={props.alt} unoptimized />;
}
