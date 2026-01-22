I will update the montage viewer to match the editor's layout logic and sorting order.

1.  **Fix Item Ordering**: Update `js/view-montage.js` to fetch items sorted by `created_at` (ascending). This ensures images layer correctly (z-index) and appear in the same order as they were added in the editor.
2.  **Enforce Layout Consistency**: Update `montagem.html` to restrict the montage container (`#montage-canvas`) to a maximum width of **1000px** (centered). This matches the fixed width I just set in the editor, ensuring the proportions and scale remain identical to what you see while editing, while still allowing it to shrink responsively on smaller screens.

This combination ensures "What You See Is What You Get" (WYSIWYG) between the editor and the public view.