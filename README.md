# 🍳 Cookbook Royale

A premium, Material 3-inspired static cookbook website with advanced recipe management, persistent theme customization, and beautiful step-by-step guides.

![Cookbook Preview](https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80)

## ✨ Modern Features

- 🎨 **Material 3 Theme System** - Three curated presets (Fresh Harvest, Modern Bistro, Cinnamon & Spice) with deep customization.
- � **Live Theme Editor** - Tweak any color or build a "Custom Theme" from scratch with real-time color pickers.
- � **Recipe Collections** - Organize your favorite recipes into custom named folders and collections.
- � **Cook History** - Track your kitchen wins! Persistent log of every time you cook a recipe.
- 🔍 **Ingredient Search** - Smart filter system to find recipes based on what's in your pantry.
- 🎥 **Video Recipe Steps** - YouTube integration for visual learners on every instruction step.
- 🛒 **Shopping List** - One-click ingredient adding to a persistent, manageable list.
- 📱 **PWA Ready** - Optimized for mobile with a dedicated bottom-nav and offline-aware manifest.
- ⚡ **Turbo Static** - Pure HTML5/CSS3/Vanilla JS with global initialization for zero-flash loading.

## 🚀 Quick Start

### Local Development

1. Clone this repository
2. Start a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```
3. Open `http://localhost:8000` in your browser

## 📁 Project Structure

```
cookbook/
├── index.html          # Discovery hub & recipe grid
├── recipe.html         # Interactive recipe details & video steps
├── shopping.html       # Dynamic shopping list manager
├── settings.html       # Theme customization and data management (Import/Export)
├── collections.html    # Folder & collection management
├── css/
│   └── styles.css      # Design system & Material 3 tokens
├── js/
│   ├── app.js          # Homepage logic & filtering
│   ├── recipe.js       # Cooking mode & video playback
│   ├── common.js       # Global theme init & shared utilities
│   ├── collections.js  # Collections & Cook History data manager
│   ├── shopping.js     # Shopping list persistence logic
│   ├── settings.js     # Theme switcher & color picker logic
│   └── import.js       # JSON data handling
└── data/
    └── recipes.json    # Initial recipe database
```

## 🎨 Theme Customization

### Curated Presets
Access these beautiful presets in **Settings**:
- **Fresh Harvest**: Organic greens and coral oranges.
- **Modern Bistro**: Sophisticated purples and mint accents.
- **Cinnamon & Spice**: Warm terracotta and cream kitchen tones.

### Live Editor
You can fine-tune any theme via the **Theme Editor**. Changes are stored in `localStorage` and applied globally via custom CSS properties:
```css
[data-theme="custom"] {
  --color-primary: #your-hex;
  --color-bg: #your-hex;
}
```

## 🍽️ Data Format

Recipes are managed via `data/recipes.json`. Example structure:

```json
{
  "id": "recipe-id",
  "title": "Title",
  "videoSteps": {
    "url": "https://youtu.be/...",
    "steps": { "1": 45, "2": 120 }
  },
  "ingredients": ["1 cup Sugar", "2 Eggs"],
  "steps": [
    { "step": 1, "title": "Prep", "description": "...", "tip": "Don't overmix!" }
  ]
}
```

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

Made with ❤️ | [View Demo](https://yourusername.github.io/cookbook)
