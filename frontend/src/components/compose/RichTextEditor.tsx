import type { ComponentType } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Bold,
  ChevronsUpDown,
  Italic,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ALIGNMENTS = ["left", "center", "right"] as const;
const ALIGN_ICONS = { left: TextAlignStart, center: TextAlignCenter, right: TextAlignEnd };

export function RichTextEditor({ value, onChange, placeholder = "Type Your Reply..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2] }, link: { openOnClick: false } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "prose-email min-h-[260px] px-4 pt-3 pb-6 text-sm leading-relaxed" },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="rounded-xl bg-[#f9f9f9]">
      <div className="px-3 pt-3">{editor && <Toolbar editor={editor} />}</div>
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      heading: editor.isActive("heading"),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      align: ALIGNMENTS.find((a) => editor.isActive({ textAlign: a })) ?? "left",
      canSink: editor.can().sinkListItem("listItem"),
      canLift: editor.can().liftListItem("listItem"),
    }),
  });

  const chain = () => editor.chain().focus();
  const nextAlign = ALIGNMENTS[(ALIGNMENTS.indexOf(state.align) + 1) % ALIGNMENTS.length];
  const AlignIcon = ALIGN_ICONS[state.align];

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 rounded-lg bg-white px-2 py-1">
      <Tool label="Undo" icon={Undo2} disabled={!state.canUndo} onClick={() => chain().undo().run()} />
      <Tool label="Redo" icon={Redo2} disabled={!state.canRedo} onClick={() => chain().redo().run()} />
      <Divider />
      <IconButton label="Heading" active={state.heading} className="w-10" onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Type className="size-4" />
        <ChevronsUpDown className="size-3" />
      </IconButton>
      <Divider />
      <Tool label="Bold" icon={Bold} active={state.bold} onClick={() => chain().toggleBold().run()} />
      <Tool label="Italic" icon={Italic} active={state.italic} onClick={() => chain().toggleItalic().run()} />
      <Tool label="Underline" icon={Underline} active={state.underline} onClick={() => chain().toggleUnderline().run()} />
      <Divider />
      <IconButton label={`Align ${nextAlign}`} className="w-10" onClick={() => chain().setTextAlign(nextAlign).run()}>
        <AlignIcon className="size-4" />
        <ChevronsUpDown className="size-3" />
      </IconButton>
      <Divider />
      <Tool label="Numbered list" icon={ListOrdered} active={state.orderedList} onClick={() => chain().toggleOrderedList().run()} />
      <Tool label="Bullet list" icon={List} active={state.bulletList} onClick={() => chain().toggleBulletList().run()} />
      <Tool label="Indent" icon={ListIndentIncrease} disabled={!state.canSink} onClick={() => chain().sinkListItem("listItem").run()} />
      <Tool label="Outdent" icon={ListIndentDecrease} disabled={!state.canLift} onClick={() => chain().liftListItem("listItem").run()} />
      <Divider />
      <Tool label="Quote" icon={Quote} active={state.blockquote} onClick={() => chain().toggleBlockquote().run()} />
      <Divider />
      <Tool label="Strikethrough" icon={Strikethrough} active={state.strike} onClick={() => chain().toggleStrike().run()} />
    </div>
  );
}

interface ToolProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function Tool({ label, icon: Icon, ...rest }: ToolProps) {
  return (
    <IconButton label={label} {...rest}>
      <Icon className="size-4" />
    </IconButton>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1.5 h-5 w-px bg-line" />;
}
