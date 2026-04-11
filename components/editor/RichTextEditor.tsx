"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useCallback, useRef } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  autoFocus?: boolean;
}

// ─── toolbar primitives ──────────────────────────────────────────────────────

function Btn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors select-none ${
        active
          ? "bg-gray-200 text-gray-900"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-gray-200 mx-0.5 self-center shrink-0" />;
}

// ─── main component ──────────────────────────────────────────────────────────

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your message…",
  minHeight = 240,
  compact = false,
  autoFocus = false,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#006B3C] underline cursor-pointer" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded" },
        allowBase64: true,
      }),
    ],
    content,
    immediatelyRender: false,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "outline-none" },
    },
  });

  // Sync external content changes (reply/forward mode switch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const insertImageUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertImageFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) return;
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (src) editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className={`flex items-center flex-wrap gap-0.5 px-2 border-b border-gray-200 bg-gray-50 ${compact ? "py-1.5" : "py-2"}`}>

        {/* Heading selector — hide in compact */}
        {!compact && (
          <>
            <select
              value={
                editor.isActive("heading", { level: 1 }) ? "h1"
                : editor.isActive("heading", { level: 2 }) ? "h2"
                : editor.isActive("heading", { level: 3 }) ? "h3"
                : "p"
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "p") editor.chain().focus().setParagraph().run();
                else editor.chain().focus().setHeading({ level: parseInt(v[1]) as 1 | 2 | 3 }).run();
              }}
              className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-1 mr-1 focus:outline-none focus:border-[#006B3C] cursor-pointer"
            >
              <option value="p">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
            <Sep />
          </>
        )}

        {/* Format */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <strong className="font-bold">B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <em>I</em>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <span className="underline">U</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <span className="line-through">S</span>
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </Btn>

        {!compact && (
          <>
            <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </Btn>
          </>
        )}

        <Sep />

        {/* Alignment */}
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h16M4 18h10" />
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 10h10M4 14h16M7 18h10" />
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 10h10M4 14h16M10 18h10" />
          </svg>
        </Btn>

        <Sep />

        {/* Link */}
        <Btn onClick={setLink} active={editor.isActive("link")} title="Insert / edit link">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </Btn>

        {/* Image — URL */}
        <Btn onClick={insertImageUrl} title="Insert image from URL">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Btn>

        {/* Image — upload from disk */}
        <Btn onClick={insertImageFile} title="Upload image from computer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text colour */}
        <label title="Text colour" className="relative p-1.5 rounded hover:bg-gray-100 cursor-pointer">
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L8.5 11h7L12 2zm0 4.2L13.68 11h-3.36L12 6.2zM3 18a3 3 0 106 0 3 3 0 00-6 0zm12 0a3 3 0 106 0 3 3 0 00-6 0z" />
          </svg>
          {/* Colour swatch under icon */}
          <div
            className="absolute bottom-0.5 left-1 right-1 h-0.5 rounded-full"
            style={{ backgroundColor: editor.getAttributes("textStyle").color || "#111827" }}
          />
          <input
            type="color"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={editor.getAttributes("textStyle").color || "#111827"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        {!compact && (
          <>
            <Sep />
            <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" active={false}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" active={false}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
              </svg>
            </Btn>
          </>
        )}
      </div>

      {/* ── Editor area ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 cursor-text"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent
          editor={editor}
          className={`
            h-full
            [&_.ProseMirror]:min-h-full
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror]:text-gray-900
            [&_.ProseMirror]:text-sm
            [&_.ProseMirror]:leading-relaxed
            [&_.ProseMirror_h1]:text-2xl
            [&_.ProseMirror_h1]:font-bold
            [&_.ProseMirror_h1]:mb-3
            [&_.ProseMirror_h1]:mt-4
            [&_.ProseMirror_h2]:text-xl
            [&_.ProseMirror_h2]:font-semibold
            [&_.ProseMirror_h2]:mb-2
            [&_.ProseMirror_h2]:mt-3
            [&_.ProseMirror_h3]:text-base
            [&_.ProseMirror_h3]:font-semibold
            [&_.ProseMirror_h3]:mb-1
            [&_.ProseMirror_h3]:mt-2
            [&_.ProseMirror_p]:mb-2
            [&_.ProseMirror_ul]:list-disc
            [&_.ProseMirror_ul]:ml-5
            [&_.ProseMirror_ul]:mb-2
            [&_.ProseMirror_ol]:list-decimal
            [&_.ProseMirror_ol]:ml-5
            [&_.ProseMirror_ol]:mb-2
            [&_.ProseMirror_li]:mb-0.5
            [&_.ProseMirror_blockquote]:border-l-4
            [&_.ProseMirror_blockquote]:border-gray-300
            [&_.ProseMirror_blockquote]:pl-4
            [&_.ProseMirror_blockquote]:text-gray-600
            [&_.ProseMirror_blockquote]:italic
            [&_.ProseMirror_blockquote]:mb-2
            [&_.ProseMirror_code]:bg-gray-100
            [&_.ProseMirror_code]:rounded
            [&_.ProseMirror_code]:px-1
            [&_.ProseMirror_code]:py-0.5
            [&_.ProseMirror_code]:text-xs
            [&_.ProseMirror_code]:font-mono
            [&_.ProseMirror_pre]:bg-gray-100
            [&_.ProseMirror_pre]:rounded-lg
            [&_.ProseMirror_pre]:p-3
            [&_.ProseMirror_pre]:mb-2
            [&_.ProseMirror_pre_code]:bg-transparent
            [&_.ProseMirror_pre_code]:p-0
            [&_.ProseMirror_a]:text-\[#006B3C\]
            [&_.ProseMirror_a]:underline
            [&_.ProseMirror_img]:max-w-full
            [&_.ProseMirror_img]:h-auto
            [&_.ProseMirror_img]:rounded
            [&_.ProseMirror_img]:my-2
            [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_.is-editor-empty:first-child::before]:text-gray-400
            [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
            [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0
          `}
        />
      </div>
    </div>
  );
}
