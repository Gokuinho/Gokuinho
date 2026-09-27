/* Client temps réel partagé (overlay, télécommande, chat). */
(function () {
  function connect(handlers) {
    let es;
    let retry = 1000;
    function open() {
      es = new EventSource('/api/events');
      es.onopen = () => {
        retry = 1000;
        if (handlers.onOpen) handlers.onOpen();
      };
      for (const name of ['state', 'alert', 'chat', 'history', 'tiktok']) {
        es.addEventListener(name, (e) => {
          const fn = handlers[name];
          if (!fn) return;
          try {
            fn(JSON.parse(e.data));
          } catch (err) {
            console.error(err);
          }
        });
      }
      es.onerror = () => {
        if (handlers.onClose) handlers.onClose();
        if (es.readyState === EventSource.CLOSED) {
          setTimeout(open, retry);
          retry = Math.min(retry * 2, 10000);
        }
      };
    }
    open();
  }

  function pin() {
    try {
      return localStorage.getItem('live-pin') || '';
    } catch (_) {
      return '';
    }
  }

  async function api(path, body, method = 'POST') {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-live-pin': pin() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status });
    return data;
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children) if (c != null) node.append(c);
    return node;
  }

  window.Live = { connect, api, el, pin };
})();
