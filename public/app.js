const messagesEl = document.getElementById('messages');
const chatBody = document.getElementById('chat');
const typingEl = document.getElementById('typing');
const textEl = document.getElementById('text');
const imageInput = document.getElementById('image');
const imageBtn = document.getElementById('imageBtn');
const imgPreview = document.getElementById('imgPreview');
const imgThumb = document.getElementById('imgThumb');
const clearImg = document.getElementById('clearImg');
const micBtn = document.getElementById('micBtn');
const sendBtn = document.getElementById('sendBtn');

let mediaRecorder;
let audioChunks = [];
let lastQueryId = null;

function renderSimpleMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)(\s*(?!<li>))/gs, '<ul>$1</ul>$2');
  html = html.replace(/\n\n/g, '<br/><br/>');
  return html;
}

function appendMessage(role, text, meta) {
  const row = document.createElement('div');
  row.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (role === 'assistant') {
    bubble.innerHTML = renderSimpleMarkdown(text);
  } else {
    bubble.textContent = text;
  }
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  if (meta) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'meta';
    metaDiv.textContent = meta;
    messagesEl.appendChild(metaDiv);
  }
  chatBody.scrollTop = chatBody.scrollHeight;
  return bubble;
}

function showTyping(show) {
  typingEl.classList.toggle('hidden', !show);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addFeedbackButtons(container, queryId) {
  const wrap = document.createElement('div');
  wrap.className = 'feedback';
  const yes = document.createElement('button');
  yes.textContent = 'Helpful';
  const no = document.createElement('button');
  no.textContent = 'Not Helpful';
  wrap.appendChild(yes);
  wrap.appendChild(no);
  container.insertAdjacentElement('afterend', wrap);

  async function send(helpful) {
    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, helpful })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Feedback failed');
      yes.disabled = true; no.disabled = true;
      yes.textContent = 'Thanks!';
    } catch (e) {
      no.textContent = 'Failed';
    }
  }

  yes.addEventListener('click', () => send(true));
  no.addEventListener('click', () => send(false));
}

function addCopyButton(container, textToCopy) {
  const row = document.createElement('div');
  row.className = 'copy-row';
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = prev), 1000);
    } catch (e) {
      btn.textContent = 'Failed';
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    }
  });
  row.appendChild(btn);
  container.insertAdjacentElement('afterend', row);
}

function autoresizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}
textEl.addEventListener('input', () => autoresizeTextarea(textEl));

imageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', () => {
  const file = imageInput.files && imageInput.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    imgThumb.src = url;
    imgPreview.classList.remove('hidden');
  } else {
    imgThumb.src = '';
    imgPreview.classList.add('hidden');
  }
});
clearImg.addEventListener('click', () => {
  imageInput.value = '';
  imgThumb.src = '';
  imgPreview.classList.add('hidden');
});

let recording = false;
micBtn.addEventListener('click', async () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = () => { micBtn.textContent = '🎙️'; recording = false; };
      mediaRecorder.start();
      recording = true;
      micBtn.textContent = '⏹️';
    } catch (e) {
      micBtn.textContent = '🚫';
      setTimeout(() => micBtn.textContent = '🎙️', 1200);
    }
  } else {
    mediaRecorder.stop();
  }
});

async function sendMessage() {
  const text = textEl.value.trim();
  const hasImage = imageInput.files && imageInput.files[0];
  const hasAudio = audioChunks.length > 0;
  if (!text && !hasImage && !hasAudio) return;

  appendMessage('user', text || (hasImage ? '[Image]' : '[Voice]'));
  textEl.value = '';
  autoresizeTextarea(textEl);

  const formData = new FormData();
  if (text) formData.append('text', text);
  if (hasImage) formData.append('image', imageInput.files[0]);
  if (hasAudio) {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    formData.append('voice', blob, 'voice.webm');
    audioChunks = [];
    micBtn.textContent = '🎙️';
  }

  showTyping(true);
  try {
    const resp = await fetch('/api/query', { method: 'POST', body: formData });
    const data = await resp.json();
    showTyping(false);
    if (!resp.ok) throw new Error(data.error || 'Request failed');

    const meta = `Confidence: ${(data.confidence * 100).toFixed(0)}%  •  Source: ${data.source}`;
    const bubble = appendMessage('assistant', data.answer || '', meta);
    lastQueryId = data.id || null;
    if (lastQueryId) addFeedbackButtons(bubble, lastQueryId);
    addCopyButton(bubble, data.answer || '');

    if (hasImage) {
      // Clean up preview
      URL.revokeObjectURL(imgThumb.src);
      imageInput.value = '';
      imgThumb.src = '';
      imgPreview.classList.add('hidden');
    }
  } catch (e) {
    showTyping(false);
    appendMessage('assistant', e.message || 'Something went wrong.');
  }
}

sendBtn.addEventListener('click', sendMessage);
textEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}); 