// Interests, Books: on touch screens, where there's no hover, tapping a book swings its cover open to the
// title page inside, and tapping again closes it (styles.css does the opening on hover).
(() => {
  if (!matchMedia("(hover: none)").matches) return;
  for (const book of document.querySelectorAll(".book")) {
    book.addEventListener("click", e => {
      if (e.target.closest("a")) return;
      book.classList.toggle("open");
    });
  }
})();
