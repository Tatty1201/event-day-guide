import Icon from "./Icon";
import CatDot from "./CatDot";
import { catById, type Spot } from "@/data/data";

type Props = { spot: Spot; onClick: () => void };

export default function SpotCard({ spot, onClick }: Props) {
  const c = catById(spot.cat);
  return (
    <button className="spot-card" onClick={onClick}>
      <CatDot cat={spot.cat} />
      <span className="spot-card-main">
        <span className="spot-card-name">{spot.name}</span>
        <span className="spot-card-sub">
          <span className="cat-tag" style={{ color: c.color }}>{c.label}</span>
          <span className="dot-sep">·</span>{spot.place}
        </span>
      </span>
      <Icon name="chevronRight" size={20} className="muted" />
    </button>
  );
}
