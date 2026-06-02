import Icon from "./Icon";
import { NOTICE_CATS, type Notice } from "@/data/data";

type Props = { notice: Notice; onClick: () => void };

export default function NoticeCard({ notice, onClick }: Props) {
  const nc = NOTICE_CATS[notice.cat];
  return (
    <button
      className={"notice-card" + (notice.cat === "important" ? " important" : "")}
      onClick={onClick}
    >
      <span className="notice-top">
        <span className="notice-badge" style={{ background: nc.color }}>
          {notice.cat === "important" && <Icon name="warning" size={13} stroke={2.6} />}
          {nc.label}
        </span>
        <span className="notice-time">
          <Icon name="clock" size={13} className="muted" />{notice.time}
        </span>
      </span>
      <span className="notice-title">{notice.title}</span>
      <span className="notice-snippet">{notice.body}</span>
    </button>
  );
}
