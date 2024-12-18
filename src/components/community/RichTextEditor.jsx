import React, { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import EmojiPicker from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Undo,
  Redo,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageToMinio } from "@/lib/uploadImage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TooltipButton = ({
  onClick,
  active,
  disabled,
  icon: Icon,
  label,
  className,
}) => {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={cn(
            active && "bg-accent",
            "text-foreground hover:bg-accent hover:text-foreground",
            className
          )}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-medium">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const MenuBar = ({ editor }) => {
  const imageInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addImage = useCallback(
    async (file) => {
      if (file) {
        try {
          const url = await uploadImageToMinio(file);
          editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
    },
    [editor]
  );

  const onEmojiClick = (emojiData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border bg-background p-1 sticky top-0 z-10">
      <div className="flex flex-wrap gap-1">
        <TooltipProvider>
          <TooltipButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            icon={Bold}
            label="Negrito (Ctrl+B)"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            icon={Italic}
            label="Itálico (Ctrl+I)"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            icon={List}
            label="Lista"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            icon={ListOrdered}
            label="Lista Numerada"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            icon={Quote}
            label="Citação"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            icon={Code}
            label="Código"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={Undo}
            label="Desfazer"
          />
          <TooltipButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={Redo}
            label="Refazer"
          />

          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-foreground hover:bg-accent hover:text-foreground",
                        showEmojiPicker && "bg-accent"
                      )}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-medium">
                  <p>Emoji</p>
                </TooltipContent>
                <PopoverContent className="w-full p-0" align="start">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme="auto"
                    width="100%"
                  />
                </PopoverContent>
              </Popover>
            </Tooltip>
          </TooltipProvider>
        </TooltipProvider>
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 text-foreground",
      },
    },
  });

  return (
    <div className="relative rounded-md border border-input bg-background">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
};

export default RichTextEditor;
