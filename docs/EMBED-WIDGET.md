# Integration du Widget IA - Cabinet d'Avocats

## Option 1: Code a copier-coller (le plus simple)

Ajoutez ce code dans votre site web, juste avant la balise `</body>`:

```html
<!-- Widget Assistant IA - Cabinet Martin et Associes -->
<elevenlabs-convai agent-id="agent_5201kg5bj2e0fzwrwjv38za70mbc"></elevenlabs-convai>
<script src="https://elevenlabs.io/convai-widget/index.js" async></script>
```

## Option 2: Bouton flottant stylise

```html
<!-- Bouton flottant avec widget -->
<style>
  .ai-widget-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 64px;
    height: 64px;
    background: #2563eb;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    z-index: 9999;
    transition: transform 0.2s;
  }
  .ai-widget-btn:hover { transform: scale(1.1); }
  .ai-widget-btn svg { width: 32px; height: 32px; fill: white; }
  .ai-widget-panel {
    position: fixed;
    bottom: 100px;
    right: 24px;
    width: 320px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 9998;
    display: none;
  }
  .ai-widget-panel.open { display: block; }
  .ai-widget-header {
    background: #2563eb;
    color: white;
    padding: 16px;
    border-radius: 16px 16px 0 0;
  }
  .ai-widget-body { padding: 16px; }
</style>

<button class="ai-widget-btn" onclick="toggleWidget()">
  <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
</button>

<div class="ai-widget-panel" id="widgetPanel">
  <div class="ai-widget-header">
    <strong>Assistant Virtuel</strong>
    <p style="font-size:14px;opacity:0.8;margin:4px 0 0">Comment puis-je vous aider ?</p>
  </div>
  <div class="ai-widget-body">
    <elevenlabs-convai agent-id="agent_5201kg5bj2e0fzwrwjv38za70mbc"></elevenlabs-convai>
  </div>
</div>

<script src="https://elevenlabs.io/convai-widget/index.js" async></script>
<script>
  function toggleWidget() {
    document.getElementById('widgetPanel').classList.toggle('open');
  }
</script>
```

## Option 3: Page dediee

Utilisez directement: `https://votre-domaine.com/widget.html`

Ou en iframe:
```html
<iframe
  src="https://votre-domaine.com/widget.html"
  width="400"
  height="600"
  frameborder="0"
></iframe>
```

## Option 4: Composant React/Next.js

```tsx
import { AIAssistantWidget, AIAssistantButton } from "@/components/ai-assistant-widget";

// Widget inline
<AIAssistantWidget />

// Bouton flottant
<AIAssistantButton />
```

## Test local

Le widget est accessible a: http://localhost:3000/widget.html

## Webhook

Tous les appels via ce widget envoient automatiquement les donnees au CRM via:
`POST /api/webhooks/elevenlabs`

Les prospects et appels sont crees automatiquement.
