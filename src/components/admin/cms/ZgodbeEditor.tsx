"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Wand2, Save } from "lucide-react";

import { storySchema, StoryInput, upsertStory } from "@/lib/actions/cms-fetch";
import { enhanceDraft, generateSEO } from "@/lib/actions/joze-cms";

export function ZgodbeEditor() {
  const [isSaving, setIsSaving] = useState(false);
  const [isJozeThinking, setIsJozeThinking] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StoryInput>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      type: "blog",
      category: "splosno",
      status: "draft",
      metadata: { focus_keywords: [], meta_description: "", og_caption: "" }
    }
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Napišite svojo zgodbo, Jože pa jo bo po želji izpilil..." })
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setValue("content_html", editor.getHTML());
      setValue("content_json", editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-forest max-w-none focus:outline-none min-h-[400px] p-6 text-earth-800"
      }
    }
  });

  const onSubmit = async (data: StoryInput) => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await upsertStory(null, data);
      if (res.success) {
        setSaveMessage("Uspešno shranjeno!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Prišlo je do napake.");
      }
    } catch {
      setSaveMessage("Povezava ni uspela.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleJozeEnhance = async () => {
    if (!editor) return;
    setIsJozeThinking(true);
    try {
      // 1. Rewrite Content
      const rawText = editor.getHTML();
      if (rawText.length > 20) {
        const enhanced = await enhanceDraft(rawText);
        editor.commands.setContent(enhanced);
        setValue("content_html", enhanced);
        setValue("content_json", editor.getJSON());
      }
      
      // 2. Generate SEO
      const title = watch("title") || "Brez naslova";
      if (title.length > 3) {
        const seo = await generateSEO(title, editor.getHTML());
        setValue("metadata", {
          focus_keywords: seo.focus_keywords,
          meta_description: seo.meta_description,
          og_caption: seo.og_caption,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsJozeThinking(false);
    }
  };

  const metaDesc = watch("metadata.meta_description");

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      
      {/* Editor Main Canvas */}
      <div className="flex-1 overflow-y-auto border-r border-earth-100 flex flex-col bg-white">
        
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-earth-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className="p-2 rounded hover:bg-earth-200 text-earth-700 font-bold"
            >
              B
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className="p-2 rounded hover:bg-earth-200 text-earth-700 italic"
            >
              I
            </button>
            <div className="h-4 w-px bg-earth-300 mx-2" />
            <button 
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className="p-2 rounded hover:bg-earth-200 text-earth-700 font-bold text-sm"
            >
              H2
            </button>
          </div>

          <button
            type="button"
            onClick={handleJozeEnhance}
            disabled={isJozeThinking}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {isJozeThinking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Vprašaj Jožeta (Apple-ify)
          </button>
        </div>

        {/* Title Input */}
        <div className="p-6 pb-2">
          <input 
            {...register("title")}
            placeholder="Naslov zgodbe..."
            className="w-full text-4xl font-extrabold text-forest-900 placeholder:text-earth-300 focus:outline-none bg-transparent"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        {/* TipTap WYSIWYG */}
        <div className="flex-1 cursor-text">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      {/* Settings Sidebar */}
      <div className="w-full md:w-80 bg-stone-50 overflow-y-auto flex flex-col">
        <div className="px-6 py-5 border-b border-earth-200 flex items-center justify-between sticky top-0 bg-stone-50/90 backdrop-blur z-10">
          <h3 className="font-bold text-forest-900">Nastavitve</h3>
          <button 
            disabled={isSaving}
            onClick={handleSubmit(onSubmit)}
            className="flex items-center gap-2 bg-forest-900 text-white rounded-xl px-4 py-2 text-sm font-bold shadow hover:bg-forest-800 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Shrani
          </button>
        </div>

        <div className="p-6 space-y-6">
          {saveMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 font-medium text-center">
              {saveMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2 block">Tip & Kategorija</label>
              <div className="flex gap-2">
                <select {...register("type")} className="flex-1 bg-white border border-earth-200 rounded-lg p-2 text-sm focus:outline-none focus:border-forest-400">
                  <option value="blog">Zgodba (Blog)</option>
                  <option value="news">Novica</option>
                </select>
                <select {...register("category")} className="flex-1 bg-white border border-earth-200 rounded-lg p-2 text-sm focus:outline-none focus:border-forest-400">
                  <option value="nasveti">Nasveti</option>
                  <option value="recepti">Recepti</option>
                  <option value="dogodki">Dogodki</option>
                  <option value="splosno">Splošno</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2 block">URL Oznaka (Slug)</label>
              <input {...register("slug")} placeholder="odlicen-domaci-kruh" className="w-full bg-white border border-earth-200 rounded-lg p-2 text-sm focus:outline-none focus:border-forest-400 font-mono text-earth-600" />
            </div>

            <div>
              <label className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2 block">Kratek Povzetek</label>
              <textarea {...register("excerpt")} rows={3} placeholder="Začne se z drožmi..." className="w-full bg-white border border-earth-200 rounded-lg p-3 text-sm focus:outline-none focus:border-forest-400 resize-none leading-relaxed" />
            </div>

            <div className="pt-4 border-t border-earth-200">
              <label className="text-xs flex items-center justify-between font-bold text-earth-500 uppercase tracking-wider mb-3">
                <span>SEO (Jože AI)</span>
                <Wand2 size={12} className="text-amber-500" />
              </label>
              {metaDesc ? (
                <div className="space-y-3 bg-white p-3 rounded-lg border border-earth-200">
                  <p className="text-xs font-medium text-forest-800">{metaDesc}</p>
                  <div className="flex flex-wrap gap-1">
                    {watch("metadata.focus_keywords")?.map((kw) => (
                      <span key={kw} className="text-[10px] uppercase tracking-wider bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full font-bold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-earth-400 p-4 border border-dashed border-earth-200 rounded-lg text-center bg-white">
                  Pritisni &quot;Vprašaj Jožeta&quot;, da zapolniš te podatke.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2 block">Status & Vidnost</label>
              <select {...register("status")} className="w-full bg-white border border-earth-200 rounded-lg p-2 text-sm focus:outline-none focus:border-forest-400 font-medium">
                <option value="draft">Shrani kot Osnutek</option>
                <option value="published">Objavljeno (Javno)</option>
                <option value="archived">Arhiv</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
