/* ===== Bytolix Floating Chat Widget ===== */
(function () {
  'use strict';

  const STORAGE_KEY = 'bytolix-chat';
  const GREETING = "Hi! I'm the **Bytolix AI**. Ask me about our services, pricing, or how we build AI agents for your business.";
  const PROMPTS = [
    { label: 'Our Services', query: 'What services does Bytolix offer?' },
    { label: 'Pricing',      query: 'What are the pricing plans?' },
    { label: 'How it works', query: 'How does Bytolix deploy AI agents?' },
    { label: 'Book a call',  query: 'How do I book a discovery call?' },
  ];

  // ── Simple markdown → HTML (bold, links, line breaks) ──────────────────────
  function md(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--white)">$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── Session storage ─────────────────────────────────────────────────────────
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.messages) && d.messages.length) {
          return { messages: d.messages, showPrompts: !d.messages.some(m => m.role === 'user') };
        }
      }
    } catch (_) {}
    return { messages: [{ role: 'assistant', content: GREETING }], showPrompts: true };
  }

  function saveSession(messages) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.filter(m => m.content) })); } catch (_) {}
  }

  // ── Build DOM ───────────────────────────────────────────────────────────────
  function buildWidget() {
    const style = document.createElement('style');
    style.textContent = `
      #bx-chat-btn{position:fixed;bottom:1.75rem;left:1.75rem;z-index:9999;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#38BDF8,#818CF8);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(56,189,248,0.4);transition:transform .2s,box-shadow .2s;padding:0}
      #bx-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(56,189,248,0.55)}
      #bx-chat-btn svg{width:26px;height:26px;fill:white;transition:opacity .15s}
      #bx-chat-pulse{position:absolute;inset:0;border-radius:50%;border:2px solid #38BDF8;animation:bx-pulse 2.4s ease-in-out infinite}
      @keyframes bx-pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:0;transform:scale(1.18)}}
      #bx-chat-dot{position:absolute;bottom:-1px;right:-1px;width:14px;height:14px;background:#34D399;border:2px solid var(--void,#04050A);border-radius:50%}
      #bx-chat-panel{position:fixed;bottom:6rem;left:1.75rem;z-index:9999;width:360px;max-width:calc(100vw - 2rem);height:500px;max-height:calc(100vh - 8rem);background:var(--card,#111827);border:1px solid rgba(99,179,237,0.15);border-radius:20px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;transition:opacity .22s ease,transform .22s ease}
      #bx-chat-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}
      #bx-chat-header{padding:14px 16px;border-bottom:1px solid rgba(99,179,237,0.1);background:rgba(56,189,248,0.06);display:flex;align-items:center;gap:10px;flex-shrink:0}
      #bx-chat-header img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(56,189,248,0.3)}
      #bx-chat-header-info .name{font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:800;color:#F0F4FF}
      #bx-chat-header-info .sub{font-size:11px;color:#6B7A99;margin-top:1px}
      #bx-chat-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(99,179,237,0.15) transparent}
      .bx-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.6;word-break:break-word}
      .bx-msg.user{background:linear-gradient(135deg,#38BDF8,#818CF8);color:#04050A;align-self:flex-end;border-bottom-right-radius:4px}
      .bx-msg.bot{background:var(--surface,#0D1422);color:#A8B4CC;align-self:flex-start;border-bottom-left-radius:4px;border:1px solid rgba(99,179,237,0.1)}
      .bx-msg.bot strong{color:#F0F4FF}
      .bx-prompts{display:flex;flex-wrap:wrap;gap:6px;padding:0 2px 4px}
      .bx-prompt-btn{font-size:11px;font-weight:600;padding:5px 11px;border-radius:100px;background:rgba(56,189,248,0.1);color:#38BDF8;border:1px solid rgba(56,189,248,0.2);cursor:pointer;transition:background .15s}
      .bx-prompt-btn:hover{background:rgba(56,189,248,0.2)}
      .bx-cta{padding:10px 12px;border-radius:12px;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.15);text-align:center;margin-top:2px}
      .bx-cta p{font-size:12px;color:#A8B4CC;margin-bottom:8px}
      .bx-cta a{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:100px;background:linear-gradient(135deg,#38BDF8,#818CF8);color:#04050A;font-size:12px;font-weight:700;text-decoration:none;font-family:'Cabinet Grotesk',sans-serif}
      .bx-typing{display:flex;align-items:center;gap:5px;padding:10px 14px;background:var(--surface,#0D1422);border:1px solid rgba(99,179,237,0.1);border-radius:16px;border-bottom-left-radius:4px;align-self:flex-start}
      .bx-typing span{width:6px;height:6px;border-radius:50%;background:#6B7A99;animation:bx-bounce .9s ease-in-out infinite}
      .bx-typing span:nth-child(2){animation-delay:.15s}
      .bx-typing span:nth-child(3){animation-delay:.3s}
      @keyframes bx-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
      #bx-chat-input-wrap{padding:12px;border-top:1px solid rgba(99,179,237,0.1);background:var(--card,#111827);display:flex;gap:8px;flex-shrink:0}
      #bx-chat-input{flex:1;background:var(--surface,#0D1422);border:1px solid rgba(99,179,237,0.2);border-radius:10px;padding:10px 14px;font-size:13px;color:#F0F4FF;font-family:'Instrument Sans',sans-serif;outline:none;transition:border-color .2s}
      #bx-chat-input:focus{border-color:#38BDF8}
      #bx-chat-input::placeholder{color:#6B7A99}
      #bx-send-btn{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#38BDF8,#818CF8);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity .2s;flex-shrink:0}
      #bx-send-btn:disabled{opacity:.4;cursor:not-allowed}
      #bx-send-btn svg{width:16px;height:16px;fill:white}
    `;
    document.head.appendChild(style);

    // Button
    const btn = document.createElement('button');
    btn.id = 'bx-chat-btn';
    btn.setAttribute('aria-label', 'Chat with Bytolix AI');
    btn.innerHTML = `
      <div id="bx-chat-pulse"></div>
      <div id="bx-chat-dot"></div>
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    `;

    // Panel
    const panel = document.createElement('div');
    panel.id = 'bx-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Bytolix AI Chat');
    panel.innerHTML = `
      <div id="bx-chat-header">
        <img src="/bytolix-logo.png" alt="Bytolix">
        <div id="bx-chat-header-info">
          <div class="name">Bytolix AI</div>
          <div class="sub">Ask about our AI services</div>
        </div>
      </div>
      <div id="bx-chat-messages"></div>
      <div id="bx-chat-input-wrap">
        <input id="bx-chat-input" type="text" placeholder="Ask about our AI agents..." autocomplete="off" />
        <button id="bx-send-btn" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    return { btn, panel };
  }

  // ── Main widget logic ───────────────────────────────────────────────────────
  function init() {
    const session = loadSession();
    const messages = session.messages;
    let showPrompts = session.showPrompts;
    let isLoading = false;
    let isOpen = false;

    const { btn, panel } = buildWidget();
    const messagesEl = panel.querySelector('#bx-chat-messages');
    const input = panel.querySelector('#bx-chat-input');
    const sendBtn = panel.querySelector('#bx-send-btn');

    // ── Render ────────────────────────────────────────────────────────────────
    function renderAll() {
      messagesEl.innerHTML = '';
      messages.forEach((m, i) => {
        if (!m.content) return;
        const div = document.createElement('div');
        div.className = 'bx-msg ' + (m.role === 'user' ? 'user' : 'bot');
        div.innerHTML = m.role === 'user' ? escapeHtml(m.content) : md(m.content);
        messagesEl.appendChild(div);
      });

      if (showPrompts && !isLoading) renderPrompts();

      const userCount = messages.filter(m => m.role === 'user').length;
      if (userCount >= 2 && !isLoading) renderCta();

      scrollBottom();
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function renderPrompts() {
      const wrap = document.createElement('div');
      wrap.className = 'bx-prompts';
      PROMPTS.forEach(p => {
        const b = document.createElement('button');
        b.className = 'bx-prompt-btn';
        b.textContent = p.label;
        b.onclick = () => sendMessage(p.query);
        wrap.appendChild(b);
      });
      messagesEl.appendChild(wrap);
    }

    function renderCta() {
      const cta = document.createElement('div');
      cta.className = 'bx-cta';
      cta.innerHTML = `<p>Want to talk to the team directly?</p><a href="https://calendly.com/bytolix-support/30min" target="_blank" rel="noopener">📅 Book a free discovery call</a>`;
      messagesEl.appendChild(cta);
    }

    function scrollBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addTypingIndicator() {
      const el = document.createElement('div');
      el.className = 'bx-typing';
      el.id = 'bx-typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(el);
      scrollBottom();
    }

    function removeTypingIndicator() {
      const el = document.getElementById('bx-typing');
      if (el) el.remove();
    }

    // ── Send ──────────────────────────────────────────────────────────────────
    async function sendMessage(text) {
      const msg = (text || input.value).trim();
      if (!msg || isLoading) return;
      input.value = '';
      showPrompts = false;
      isLoading = true;
      sendBtn.disabled = true;

      messages.push({ role: 'user', content: msg });
      renderAll();
      addTypingIndicator();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });

        if (!response.ok) throw new Error('API error');

        removeTypingIndicator();
        messages.push({ role: 'assistant', content: '' });
        const botIdx = messages.length - 1;

        // Add bot message div
        const botDiv = document.createElement('div');
        botDiv.className = 'bx-msg bot';
        messagesEl.appendChild(botDiv);
        scrollBottom();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullText += data.text;
                  messages[botIdx].content = fullText;
                  botDiv.innerHTML = md(fullText);
                  scrollBottom();
                }
              } catch (_) {}
            }
          }
        }

        saveSession(messages);
        renderAll(); // re-render to add CTA if needed
      } catch (err) {
        removeTypingIndicator();
        messages.push({ role: 'assistant', content: 'Something went wrong. [Book a call](https://calendly.com/bytolix-support/30min) or email hello@bytolix.com' });
        renderAll();
        saveSession(messages);
      } finally {
        isLoading = false;
        sendBtn.disabled = false;
        input.focus();
      }
    }

    // ── Toggle open/close ─────────────────────────────────────────────────────
    function toggle() {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      if (isOpen) {
        renderAll();
        setTimeout(() => input.focus(), 80);
      }
    }

    btn.addEventListener('click', toggle);

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    sendBtn.addEventListener('click', () => sendMessage());

    // Initial render if panel is shown
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
