import Icon from "./Icon";
import { catById } from "@/data/data";

type Props = { cat: string; size?: number };

export default function CatDot({ cat, size = 36 }: Props) {
  const c = catById(cat);
  return (
    <span className="cat-dot" style={{ width: size, height: size, background: c.color }}>
      <Icon name={c.icon} size={size * 0.52} stroke={2.2} />
    </span>
  );
}
