import { useState } from "react";
import { cosmetics, type Category, type Player } from "@/lib/neon-dash/progression";

export function NeonDashShop({ player, selection, feedback, onAction, onBack }: {
  player: Player; selection: boolean; feedback: string;
  onAction: (category: Category, id: string, action: "buy" | "equip") => void;
  onBack: () => void;
}) {
  const [category, setCategory] = useState<Category>("skins");
  return <section className="neon-shop" aria-label={selection ? "Character selection" : "Cosmetic shop"}>
    <div className="neon-buttons"><button type="button" onClick={onBack}>Back to menu</button><strong>Wallet: {player.wallet.toLocaleString()} coins</strong></div>
    <h2>{selection ? "Character selection" : "Cosmetic shop"}</h2>
    {!selection && <div className="neon-buttons" role="group" aria-label="Shop category">
      <button type="button" aria-pressed={category === "skins"} onClick={() => setCategory("skins")}>Character skins</button>
      <button type="button" aria-pressed={category === "trails"} onClick={() => setCategory("trails")}>Running trails</button>
    </div>}
    <p role="status">{feedback || "Cosmetic only. Earn coins by finishing runs."}</p>
    <div className="neon-shop-grid">{cosmetics[category].map(item => {
      const [base, trim = base, light = trim] = item.colors;
      const owned = player.owned[category].includes(item.id);
      const equipped = player.equipped[category] === item.id;
      return <article key={item.id}>
        <svg viewBox="0 0 120 56" aria-hidden="true">
          {category === "skins" ? <>
            <path d="M57 33 48 42 40 48m19-14 9 9 11 4" stroke="#8879e0" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M54 33 58 22" stroke={base} strokeWidth="13" strokeLinecap="round" />
            <path d="M57 25 65 31 73 27" stroke={trim} strokeWidth="5" fill="none" strokeLinecap="round" />
            <rect x="55" y="8" width="20" height="14" rx={item.id === "shadow" ? 6 : 2} fill={trim} />
            <rect x="60" y="12" width="15" height={item.id === "ninja" ? 2 : 4} fill={light} />
            {item.id === "gold" && <path d="M55 8l4-6 5 6 6-6 5 6" stroke={light} fill="none" />}
            {item.id === "ninja" && <path d="M56 12 44 15 39 20" stroke={trim} strokeWidth="3" fill="none" />}
            {item.id === "phantom" && <path d="M45 15h6m23 10h6m-38 5h5" stroke={trim} strokeWidth="2" />}
          </> : [0, 1, 2, 3, 4].map(index => <rect key={index} x={20 + index * 16} y={item.id === "sparks" ? 27 + (index % 2 ? 7 : -7) : 28} width={item.id === "streak" ? 15 : item.id === "sparks" ? 4 : 10} height={item.id === "pulse" ? 2 + index : 3} fill={base} opacity={.25 + index * .16} />)}
        </svg>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>{equipped ? "Equipped" : owned ? "Owned" : `${item.price.toLocaleString()} coins`}</strong>
        {!equipped && <button type="button" onClick={() => onAction(category, item.id, owned ? "equip" : "buy")}>{owned ? "Equip" : selection ? "Unlock" : "Buy"} {item.name}</button>}
      </article>;
    })}</div>
  </section>;
}
