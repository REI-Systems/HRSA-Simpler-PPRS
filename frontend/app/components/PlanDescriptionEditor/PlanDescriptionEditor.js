'use client';

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './PlanDescriptionEditor.module.css';

const MAX_CHARS_WITHOUT_SPACES = 500;

/** Count characters in text excluding spaces. */
function countCharsWithoutSpaces(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.replace(/\s/g, '').length;
}

/** Strip HTML tags to plain text. */
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

/** Ensure value is valid HTML for TipTap. Plain text from DB is wrapped in <p> so it displays. */
function toEditorHtml(value) {
  const s = (value || '').trim();
  if (!s) return '';
  if (s.startsWith('<') && (s.includes('</') || s.endsWith('>'))) return s;
  return '<p>' + s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
}

const PlanDescriptionEditor = forwardRef(function PlanDescriptionEditor({
  value = '',
  onChange,
  maxLength = MAX_CHARS_WITHOUT_SPACES,
  placeholder = '',
  disabled = false,
  hideTabs = false,
}, ref) {
  const [activeTab, setActiveTab] = useState('design');
  const [charsUsed, setCharsUsed] = useState(() => countCharsWithoutSpaces(stripHtml(value)));
  const showEditor = hideTabs || activeTab === 'design';
  const showPreview = !hideTabs && activeTab === 'preview';

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const used = countCharsWithoutSpaces(text);
      setCharsUsed(used);
      // Always notify parent so Save sends current content; character limit is still shown in UI
      if (typeof onChange === 'function') {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
  });

  // Sync external value into editor (e.g. when plan loads from DB)
  useEffect(() => {
    if (!editor) return;
    const htmlToSet = toEditorHtml(value);
    const current = editor.getHTML();
    const emptyCurrent = !current || current === '<p></p>' || current === '<p></p>\n';
    const hasNewContent = htmlToSet.length > 0 && htmlToSet !== '<p></p>';
    if (hasNewContent && (htmlToSet !== current || emptyCurrent)) {
      editor.commands.setContent(htmlToSet || '<p></p>', false);
      setCharsUsed(countCharsWithoutSpaces(editor.getText()));
    } else if (!hasNewContent && !emptyCurrent) {
      editor.commands.setContent('<p></p>', false);
      setCharsUsed(0);
    }
  }, [value, editor]);

  useImperativeHandle(ref, () => ({
    getContent: () => (editor ? editor.getHTML() : ''),
  }), [editor]);

  const charsLeft = Math.max(0, maxLength - charsUsed);
  const isOverLimit = charsUsed > maxLength;

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);

  return (
    <div className={styles.wrapper}>
      {!hideTabs && (
        <>
          <p className={styles.hint}>Approximately 1/4 page</p>
          <p className={styles.charCount}>
            (Max {maxLength} Characters without spaces):{' '}
            <strong className={isOverLimit ? styles.overLimit : ''}>
              {charsLeft} Characters left.
            </strong>
            <span className={styles.infoIcon} title="Character count excludes spaces">
              <i className="bi bi-info-circle" aria-hidden />
            </span>
          </p>
        </>
      )}
      {!hideTabs && (
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'design' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('design')}
          >
            <i className="bi bi-pencil" aria-hidden />
            Design
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'preview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <i className="bi bi-search" aria-hidden />
            Preview
          </button>
        </div>
      )}
      {showEditor && (
        <div className={styles.editorWrap}>
          {!disabled && (
            <div className={styles.toolbar}>
              <button type="button" onClick={toggleBold} className={styles.toolbarBtn} aria-label="Bold">
                <i className="bi bi-type-bold" aria-hidden />
              </button>
              <button type="button" onClick={toggleItalic} className={styles.toolbarBtn} aria-label="Italic">
                <i className="bi bi-type-italic" aria-hidden />
              </button>
              <button type="button" onClick={toggleBulletList} className={styles.toolbarBtn} aria-label="Bullet list">
                <i className="bi bi-list-ul" aria-hidden />
              </button>
              <button type="button" onClick={toggleOrderedList} className={styles.toolbarBtn} aria-label="Numbered list">
                <i className="bi bi-list-ol" aria-hidden />
              </button>
            </div>
          )}
          <EditorContent editor={editor} className={styles.editorContent} />
        </div>
      )}
      {showPreview && (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: (value || '').trim() || '<p></p>' }}
        />
      )}
    </div>
  );
});

export default PlanDescriptionEditor;
