import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaPlus, FaTrash, FaTag, FaSpinner, FaTimes,
  FaCamera, FaImage, FaCheck, FaEdit, FaSave,
} from 'react-icons/fa';
import api from '../services/api';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const slugify = (text) =>
  text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';

// ─── CategoryManager ──────────────────────────────────────────────────────────
// Shown inside the Images step only when a property already has an ID.
// For brand-new properties (no ID yet) it renders a simple offline list
// that gets synced to the backend once the property is created.

export function CategoryManager({ propertyId, categories, onChange }) {
  const [newName, setNewName]         = useState('');
  const [adding, setAdding]           = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [editName, setEditName]       = useState('');
  const [deletingId, setDeletingId]   = useState(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      if (propertyId) {
        const res = await api.imageCategories.create(propertyId, name);
        onChange([...categories, res.data]);
      } else {
        // Offline mode: property not saved yet
        const tmp = { id: `tmp_${Date.now()}`, name, slug: slugify(name), sort_order: categories.length };
        onChange([...categories, tmp]);
      }
      setNewName('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async (cat) => {
    const name = editName.trim();
    if (!name || name === cat.name) { setEditingId(null); return; }
    try {
      if (propertyId && !String(cat.id).startsWith('tmp_')) {
        const res = await api.imageCategories.update(propertyId, cat.id, { name });
        onChange(categories.map(c => c.id === cat.id ? res.data : c));
      } else {
        onChange(categories.map(c => c.id === cat.id ? { ...c, name, slug: slugify(name) } : c));
      }
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rename category');
    }
  };

  const handleDelete = async (cat) => {
    setDeletingId(cat.id);
    try {
      if (propertyId && !String(cat.id).startsWith('tmp_')) {
        await api.imageCategories.delete(propertyId, cat.id);
      }
      onChange(categories.filter(c => c.id !== cat.id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
      <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 font-medium">
        Image Categories
      </p>

      {/* existing categories */}
      <div className="space-y-1.5">
        {categories.map(cat => (
          <motion.div
            key={cat.id}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 bg-white border border-stone-100 rounded-xl px-3 py-2"
          >
            <FaTag className="text-[#ED9B40] text-xs flex-shrink-0" />

            {editingId === cat.id ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(cat);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 text-sm f-body bg-transparent outline-none border-b border-[#093A3E] text-stone-800"
              />
            ) : (
              <span className="flex-1 text-sm f-body text-stone-700">{cat.name}</span>
            )}

            <span className="text-[10px] text-stone-400 f-body hidden sm:block">{cat.slug}</span>

            {editingId === cat.id ? (
              <button
                onClick={() => handleRename(cat)}
                className="w-6 h-6 rounded-lg bg-[#093A3E] text-white flex items-center justify-center hover:bg-[#0a4a52] transition-colors"
              >
                <FaSave size={9} />
              </button>
            ) : (
              <button
                onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                className="w-6 h-6 rounded-lg text-stone-300 hover:text-[#093A3E] hover:bg-stone-100 flex items-center justify-center transition-colors"
              >
                <FaEdit size={10} />
              </button>
            )}

            <button
              onClick={() => handleDelete(cat)}
              disabled={deletingId === cat.id}
              className="w-6 h-6 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-40"
            >
              {deletingId === cat.id
                ? <FaSpinner size={9} className="animate-spin" />
                : <FaTrash size={9} />}
            </button>
          </motion.div>
        ))}

        {categories.length === 0 && (
          <p className="text-xs text-stone-400 f-body text-center py-2">
            No categories yet — add one below
          </p>
        )}
      </div>

      {/* add new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="e.g. Master Bedroom, Rooftop…"
          className="flex-1 text-sm f-body px-3 py-2 border border-stone-200 rounded-xl outline-none focus:border-[#093A3E] bg-white transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#093A3E] text-white rounded-xl f-body text-sm font-medium hover:bg-[#0a4a52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? <FaSpinner size={11} className="animate-spin" /> : <FaPlus size={11} />}
          Add
        </button>
      </div>
    </div>
  );
}

// ─── CategorySelect ────────────────────────────────────────────────────────────
// Tiny dropdown used on each image tile.

function CategorySelect({ value, categories, onChange }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      onClick={e => e.stopPropagation()}
      className="w-full mt-1 text-[10px] f-body px-1.5 py-1 border border-stone-200 rounded-lg bg-white outline-none focus:border-[#093A3E] transition-colors cursor-pointer"
    >
      <option value="">— no category —</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.slug}>{cat.name}</option>
      ))}
    </select>
  );
}

// ─── StepImages (main export) ─────────────────────────────────────────────────

export default function StepImages({
  form,
  setForm,
  onCoverUpload,
  onGalleryUpload,
  onRemoveNewGallery,
  onDeleteImage,
  deletingImgId,
  propertyId,        // undefined for new properties
  categories,        // ImageCategory[] managed by parent
  onCategoriesChange,
}) {
  // Track per-image category assignments for NEW (not-yet-saved) images
  // keyed by their index in form.galleryImages
  const [newImageCategories, setNewImageCategories] = useState({});

  // Track per-image category for SAVED images (update is sent immediately)
  const [updatingCatForId, setUpdatingCatForId] = useState(null);

  // Reset new-image category map when gallery changes
  useEffect(() => {
    setNewImageCategories(prev => {
      const next = {};
      form.galleryImages.forEach((_, i) => { next[i] = prev[i] || null; });
      return next;
    });
  }, [form.galleryImages.length]);

  const handleNewImageCategory = (idx, slug) => {
    setNewImageCategories(prev => ({ ...prev, [idx]: slug }));
    // Expose to parent form so it can be submitted with the image
    setForm(p => {
      const updated = [...p.galleryImages];
      updated[idx] = Object.assign(updated[idx], { _category: slug });
      return { ...p, galleryImages: updated };
    });
  };

  const handleSavedImageCategory = async (imageUrl, slug) => {
    const m = imageUrl.match(/\/property-image\/(\d+)/);
    if (!m) return;
    const imageId = parseInt(m[1]);
    setUpdatingCatForId(imageId);
    try {
      await api.imageCategories.assignImage(imageId, slug);
      // Update local preview list
      setForm(p => ({
        ...p,
        galleryPreviews: [...p.galleryPreviews], // triggers re-render
        _imageCategoryMap: { ...(p._imageCategoryMap || {}), [imageId]: slug },
      }));
      toast.success('Category updated', { icon: '🏷️', duration: 2000 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update category');
    } finally {
      setUpdatingCatForId(null);
    }
  };

  const getCategoryForSavedUrl = (url) => {
    const m = url.match(/\/property-image\/(\d+)/);
    if (!m) return null;
    return form._imageCategoryMap?.[parseInt(m[1])] ?? null;
  };

  return (
    <div className="space-y-6">

      {/* ── Category Manager ── */}
      <CategoryManager
        propertyId={propertyId}
        categories={categories}
        onChange={onCategoriesChange}
      />

      {/* ── Cover Image ── */}
      <div>
        <p className="f-body text-[10px] uppercase tracking-widest text-stone-400 mb-3">Cover Image</p>
        <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={onCoverUpload} />

        {form.coverPreview ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden group">
            <img src={form.coverPreview} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label
                htmlFor="cover-upload"
                className="cursor-pointer flex items-center gap-2 bg-white/90 text-stone-800 px-4 py-2 rounded-xl text-xs f-body font-medium hover:bg-white transition-colors"
              >
                <FaCamera /> Change
              </label>
              <button
                type="button"
                onClick={() => {
                  if (form.coverPreview.startsWith('blob:')) {
                    URL.revokeObjectURL(form.coverPreview);
                    setForm(p => ({ ...p, coverImage: null, coverPreview: '' }));
                  } else {
                    onDeleteImage(form.coverPreview);
                  }
                }}
                disabled={!!deletingImgId}
                className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-xl text-xs f-body font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingImgId ? <FaSpinner className="animate-spin" /> : <FaTrash />} Remove
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-[#093A3E]/80 text-white text-[10px] px-2 py-0.5 rounded f-body">
              Cover
            </div>
          </div>
        ) : (
          <label
            htmlFor="cover-upload"
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-stone-200 rounded-2xl aspect-video cursor-pointer hover:border-[#093A3E] hover:bg-[#F5F4F0] transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-white flex items-center justify-center transition-colors">
              <FaCamera className="text-stone-300 group-hover:text-[#093A3E] text-xl transition-colors" />
            </div>
            <div className="text-center">
              <p className="f-body text-sm text-stone-500 group-hover:text-[#093A3E] transition-colors font-medium">Upload Cover Image</p>
              <p className="f-body text-xs text-stone-300 mt-0.5">JPG, PNG up to 10 MB</p>
            </div>
          </label>
        )}
      </div>

      {/* ── Gallery Images ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="f-body text-[10px] uppercase tracking-widest text-stone-400">Gallery Images</p>
          <label
            htmlFor="gallery-upload"
            className="cursor-pointer flex items-center gap-1.5 text-xs f-body font-medium text-[#093A3E] bg-[#093A3E]/5 px-3 py-1.5 rounded-lg hover:bg-[#093A3E]/10 transition-colors"
          >
            <FaPlus size={10} /> Add images
          </label>
          <input type="file" id="gallery-upload" accept="image/*" multiple className="hidden" onChange={onGalleryUpload} />
        </div>

        {form.galleryPreviews.length === 0 ? (
          <label
            htmlFor="gallery-upload"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-100 rounded-2xl py-8 cursor-pointer hover:border-stone-200 transition-colors"
          >
            <FaImage className="text-stone-200 text-2xl" />
            <p className="f-body text-xs text-stone-300">No gallery images yet</p>
          </label>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {form.galleryPreviews.map((url, i) => {
              const imgId     = url.match(/\/property-image\/(\d+)/)?.[1];
              const isNew     = url.startsWith('blob:');
              const isDeleting = deletingImgId === imgId;
              const isUpdating = updatingCatForId === (imgId ? parseInt(imgId) : null);

              const currentCat = isNew
                ? newImageCategories[i] || null
                : getCategoryForSavedUrl(url);

              return (
                <motion.div
                  key={url + i}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative rounded-xl overflow-hidden bg-stone-100 border border-stone-200"
                >
                  {/* Image */}
                  <div className="relative aspect-square group">
                    <img src={url} alt="" className="w-full h-full object-cover" />

                    {/* Status badges */}
                    {!isNew && (
                      <div className="absolute top-1.5 left-1.5 bg-[#093A3E]/80 text-white text-[8px] px-1.5 py-0.5 rounded f-body">
                        saved
                      </div>
                    )}
                    {currentCat && (
                      <div className="absolute top-1.5 right-1.5 bg-[#ED9B40]/90 text-white text-[8px] px-1.5 py-0.5 rounded f-body max-w-[70%] truncate">
                        {categories.find(c => c.slug === currentCat)?.name || currentCat}
                      </div>
                    )}

                    {/* Delete overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => isNew ? onRemoveNewGallery(i) : onDeleteImage(url)}
                        disabled={isDeleting}
                        className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? <FaSpinner className="animate-spin" size={11} /> : <FaTrash size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Category selector */}
                  <div className="px-2 pb-2 pt-1 bg-white">
                    {isUpdating ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 f-body py-1">
                        <FaSpinner size={9} className="animate-spin" /> Saving…
                      </div>
                    ) : (
                      <CategorySelect
                        value={currentCat}
                        categories={categories}
                        onChange={(slug) => {
                          if (isNew) {
                            handleNewImageCategory(i, slug);
                          } else {
                            handleSavedImageCategory(url, slug);
                          }
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Add more tile */}
            <label
              htmlFor="gallery-upload"
              className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:border-[#093A3E] hover:bg-[#F5F4F0] transition-all group"
            >
              <FaPlus className="text-stone-300 group-hover:text-[#093A3E] transition-colors text-lg" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}