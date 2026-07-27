(function () {
  const subtitle = document.querySelector('#subtitle');
  const banner = document.querySelector('#banner');

  if (subtitle && banner) {
    const title = subtitle.dataset.typedText || subtitle.textContent;
    const bannerTitle = document.createElement('div');

    bannerTitle.className = 'xiaolan-banner-title';
    bannerTitle.textContent = title;
    banner.appendChild(bannerTitle);
  }

  const editor = document.querySelector('[data-editor]');

  if (!editor) {
    return;
  }

  const owner = 'Ruiuoo073';
  const repo = 'Ruiuoo073.github.io';
  const draftKey = 'xiaolan-note-draft';

  const titleInput = editor.querySelector('[data-note-title]');
  const tagsInput = editor.querySelector('[data-note-tags]');
  const slugInput = editor.querySelector('[data-note-slug]');
  const dateInput = editor.querySelector('[data-note-date]');
  const bodyInput = editor.querySelector('[data-note-body]');
  const preview = editor.querySelector('[data-note-preview]');
  const source = editor.querySelector('[data-note-source]');
  const tokenInput = editor.querySelector('[data-github-token]');
  const branchInput = editor.querySelector('[data-github-branch]');
  const statusText = editor.querySelector('[data-sync-status]');

  const pad = function (value) {
    return String(value).padStart(2, '0');
  };

  const formatDateTimeLocal = function (date) {
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-') + 'T' + [pad(date.getHours()), pad(date.getMinutes())].join(':');
  };

  const formatHexoDate = function (value) {
    const date = new Date(value);

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-') + ' ' + [pad(date.getHours()), pad(date.getMinutes()), '00'].join(':');
  };

  const slugify = function (value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getTags = function () {
    return tagsInput.value
      .split(',')
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  };

  const getSlug = function () {
    return slugify(slugInput.value || titleInput.value || 'new-note');
  };

  const getMarkdown = function () {
    const tags = getTags();
    const frontMatterTags = tags.length
      ? tags.map(function (tag) {
        return '  - ' + tag;
      }).join('\n')
      : '';

    return [
      '---',
      'title: ' + titleInput.value.trim(),
      'date: ' + formatHexoDate(dateInput.value),
      'tags:',
      frontMatterTags,
      '---',
      '',
      bodyInput.value.trim(),
      ''
    ].join('\n');
  };

  const escapeHtml = function (value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const renderInline = function (value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  };

  const renderMarkdown = function (value) {
    const lines = value.split('\n');
    const html = [];
    let inList = false;
    let inCode = false;
    let codeLines = [];

    lines.forEach(function (line) {
      if (line.startsWith('```')) {
        if (inCode) {
          html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
          codeLines = [];
          inCode = false;
        } else {
          inCode = true;
        }

        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      if (/^\s*-\s+/.test(line)) {
        if (!inList) {
          html.push('<ul>');
          inList = true;
        }

        html.push('<li>' + renderInline(line.replace(/^\s*-\s+/, '')) + '</li>');
        return;
      }

      if (inList) {
        html.push('</ul>');
        inList = false;
      }

      if (/^###\s+/.test(line)) {
        html.push('<h3>' + renderInline(line.replace(/^###\s+/, '')) + '</h3>');
      } else if (/^##\s+/.test(line)) {
        html.push('<h2>' + renderInline(line.replace(/^##\s+/, '')) + '</h2>');
      } else if (/^#\s+/.test(line)) {
        html.push('<h1>' + renderInline(line.replace(/^#\s+/, '')) + '</h1>');
      } else if (line.trim()) {
        html.push('<p>' + renderInline(line) + '</p>');
      }
    });

    if (inList) {
      html.push('</ul>');
    }

    if (inCode) {
      html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
    }

    return html.join('');
  };

  const saveDraft = function () {
    const draft = {
      title: titleInput.value,
      tags: tagsInput.value,
      slug: slugInput.value,
      date: dateInput.value,
      body: bodyInput.value
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
    statusText.textContent = '草稿已保存到当前浏览器。';
  };

  const loadDraft = function () {
    const rawDraft = localStorage.getItem(draftKey);
    const draft = rawDraft ? JSON.parse(rawDraft) : {};

    titleInput.value = draft.title || 'Flutter 学习笔记';
    tagsInput.value = draft.tags || 'Flutter, Dart, 移动端开发';
    slugInput.value = draft.slug || 'flutter-study-note';
    dateInput.value = draft.date || formatDateTimeLocal(new Date());
    bodyInput.value = draft.body || '## 今天学了什么？\n\n- Flutter 基础概念\n- Dart 语法\n- 常用组件\n\n## 示例\n\n```dart\nvoid main() {\n  print(\"Hello Flutter\");\n}\n```';
  };

  const updatePreview = function () {
    const markdown = getMarkdown();
    preview.innerHTML = renderMarkdown(bodyInput.value);
    source.textContent = markdown;

    if (!slugInput.value.trim()) {
      slugInput.value = getSlug();
    }
  };

  const downloadNote = function () {
    const markdown = getMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = getSlug() + '.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const copyNote = function () {
    navigator.clipboard.writeText(getMarkdown());
    statusText.textContent = 'Markdown 源码已复制。';
  };

  const encodeBase64 = function (value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';

    bytes.forEach(function (byte) {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  };

  const requestGitHub = function (url, token, options) {
    return fetch(url, Object.assign({
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }, options));
  };

  const syncGitHub = function () {
    const token = tokenInput.value.trim();
    const branch = branchInput.value.trim();
    const path = 'source/_posts/' + getSlug() + '.md';
    const fileUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + encodeURIComponent(path).replace(/%2F/g, '/');

    if (!token || !branch) {
      statusText.textContent = '请填写 GitHub Token 和分支。';
      return;
    }

    statusText.textContent = '正在检查远程文件...';

    requestGitHub(fileUrl + '?ref=' + encodeURIComponent(branch), token, { method: 'GET' })
      .then(function (response) {
        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          return response.text().then(function (body) {
            throw new Error('读取远程文件失败：' + response.status + ' ' + body);
          });
        }

        return response.json();
      })
      .then(function (existingFile) {
        const payload = {
          message: 'Add note: ' + titleInput.value.trim(),
          content: encodeBase64(getMarkdown()),
          branch: branch
        };

        if (existingFile && existingFile.sha) {
          payload.message = 'Update note: ' + titleInput.value.trim();
          payload.sha = existingFile.sha;
        }

        statusText.textContent = '正在同步到 GitHub...';

        return requestGitHub(fileUrl, token, {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (body) {
            throw new Error('同步失败：' + response.status + ' ' + body);
          });
        }

        statusText.textContent = '同步成功。GitHub Actions 会重新生成网站。';
      })
      .catch(function (error) {
        statusText.textContent = error.message;
      });
  };

  editor.querySelector('[data-save-draft]').addEventListener('click', saveDraft);
  editor.querySelector('[data-download-note]').addEventListener('click', downloadNote);
  editor.querySelector('[data-copy-note]').addEventListener('click', copyNote);
  editor.querySelector('[data-sync-github]').addEventListener('click', syncGitHub);

  Array.from(editor.querySelectorAll('[data-preview-tab]')).forEach(function (button) {
    button.addEventListener('click', function () {
      Array.from(editor.querySelectorAll('[data-preview-tab]')).forEach(function (tab) {
        tab.classList.remove('is-active');
      });

      button.classList.add('is-active');
      editor.dataset.preview = button.dataset.previewTab;
    });
  });

  [titleInput, tagsInput, slugInput, dateInput, bodyInput].forEach(function (input) {
    input.addEventListener('input', updatePreview);
  });

  editor.dataset.preview = 'preview';
  loadDraft();
  updatePreview();
}());
