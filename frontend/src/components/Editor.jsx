import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import History from '@tiptap/extension-history';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback, useRef } from 'react';
import {
  Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo, Redo, Type
} from 'lucide-react';

export default function Editor({ content, onChange, readOnly = false }) {
  const saveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      History,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: content || '<p></p>',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onChange?.(editor.getHTML());
      }, 600); // debounce 600ms
    },
  });

  // Sync external content changes (e.g. loading different doc)
  useEffect(() => {
    if (editor && content !== undefined) {
      const current = editor.getHTML();
      if (current !== content) {
        editor.commands.setContent(content || '<p></p>', false);
      }
    }
  }, [content, editor]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!readOnly && <Toolbar editor={editor} />}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '40px 60px',
      }}>
        <div style={{
          maxWidth: 760, margin: '0 auto',
          minHeight: '100%',
        }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function Toolbar({ editor }) {
  const ToolBtn = ({ onClick, active, title, children }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`toolbar-btn ${active ? 'is-active' : ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, border: 'none', borderRadius: 5,
        background: 'transparent', cursor: 'pointer',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!e.currentTarget.classList.contains('is-active')) e.currentTarget.style.background = 'var(--bg)'; }}
      onMouseLeave={e => { if (!e.currentTarget.classList.contains('is-active')) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
  );

  return (
    <div style={{
      height: 'var(--toolbar-height)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 2,
      background: 'var(--surface)',
      flexWrap: 'wrap',
      overflowX: 'auto',
    }}>
      {/* History */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
        <Undo size={15} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
        <Redo size={15} />
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={15} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={15} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={15} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive('paragraph')}
        title="Normal text"
      >
        <Type size={15} />
      </ToolBtn>

      <Divider />

      {/* Inline formatting */}
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <BoldIcon size={15} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <ItalicIcon size={15} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={15} />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <List size={15} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <ListOrdered size={15} />
      </ToolBtn>
    </div>
  );
}
