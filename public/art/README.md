# Card art

Drop card images here (square, ideally 512x512 or similar,
jpg/png/webp) and reference them from each card's `image` field in
`expansions/`, with a path relative to `public/`:

```js
// expansions/my-expansion/my-card.js
module.exports = {
  // ...
  image: "art/my-card.png",
};
```

If a card has no `image`, it automatically shows a generic icon based
on its type (⚔ minion, ✦ spell) — you don't need art for every card
from day one.
