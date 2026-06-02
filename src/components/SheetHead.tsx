import React from "react";
import Icon from "./Icon";

type Props = {
  title: React.ReactNode;
  sub?: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: React.ReactNode;
};

export default function SheetHead({ title, sub, onBack, onClose, right }: Props) {
  return (
    <div className="sheet-head">
      {onBack && (
        <button className="head-icon" onClick={onBack} aria-label="戻る">
          <Icon name="back" size={22} />
        </button>
      )}
      <div className="sheet-head-text">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {right}
      {onClose && (
        <button className="head-icon" onClick={onClose} aria-label="閉じる">
          <Icon name="close" size={20} />
        </button>
      )}
    </div>
  );
}
