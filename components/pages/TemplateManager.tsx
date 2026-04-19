'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import type { TourTemplate } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Search,
  Package,
} from 'lucide-react';
import { useState } from 'react';

/* ─── Empty form state ─────────────────────────────────────────────── */

const EMPTY_FORM = {
  title: '',
  description: '',
  basePricePerPerson: 0,
  durationHours: 0,
  minAge: 5,
  itinerary: [''],
  inclusions: [''],
};

type FormState = typeof EMPTY_FORM;

/* ─── Component ────────────────────────────────────────────────────── */

export default function TemplateManager() {
  const { templates, slots, addTemplate, updateTemplate, deleteTemplate } = useVegasStore();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Filtered templates ──────────────────────────────────────────
  const filtered = templates.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  // ── Form helpers ────────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(template: TourTemplate) {
    setForm({
      title: template.title,
      description: template.description,
      basePricePerPerson: template.basePricePerPerson,
      durationHours: template.durationHours,
      minAge: template.minAge,
      itinerary: [...template.itinerary],
      inclusions: [...template.inclusions],
    });
    setEditingId(template.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSave() {
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      basePricePerPerson: Number(form.basePricePerPerson),
      durationHours: Number(form.durationHours),
      minAge: Number(form.minAge),
      itinerary: form.itinerary.filter((s) => s.trim() !== ''),
      inclusions: form.inclusions.filter((s) => s.trim() !== ''),
    };

    if (!data.title || data.basePricePerPerson <= 0 || data.durationHours <= 0) return;

    if (editingId) {
      updateTemplate(editingId, data);
    } else {
      addTemplate(data);
    }
    closeForm();
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    setDeleteConfirm(null);
  }

  // ── Dynamic list helpers ────────────────────────────────────────
  function updateListItem(field: 'itinerary' | 'inclusions', index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  }

  function addListItem(field: 'itinerary' | 'inclusions') {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  }

  function removeListItem(field: 'itinerary' | 'inclusions', index: number) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  // ── Slot count for a template ───────────────────────────────────
  function slotCount(templateId: string) {
    return slots.filter((s) => s.templateId === templateId).length;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {/* ── Create/Edit Form ──────────────────────────────────────── */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {editingId ? 'Edit Template' : 'New Template'}
            </h3>
            <button onClick={closeForm} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                placeholder="Grand Canyon Day Trip"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Base Price/Person ($) *</label>
              <input
                type="number"
                min={1}
                value={form.basePricePerPerson || ''}
                onChange={(e) => setForm({ ...form, basePricePerPerson: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration (hours) *</label>
              <input
                type="number"
                min={1}
                value={form.durationHours || ''}
                onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>

            {/* Min Age */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Minimum Age</label>
              <input
                type="number"
                min={0}
                value={form.minAge}
                onChange={(e) => setForm({ ...form, minAge: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
              placeholder="Describe the tour experience…"
            />
          </div>

          {/* Itinerary */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Itinerary Stops</label>
            <div className="space-y-2">
              {form.itinerary.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted font-mono w-6 text-right">{i + 1}.</span>
                  <input
                    type="text"
                    value={stop}
                    onChange={(e) => updateListItem('itinerary', i, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="Stop name"
                  />
                  {form.itinerary.length > 1 && (
                    <button onClick={() => removeListItem('itinerary', i)} className="p-1 text-muted-foreground hover:text-danger transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem('itinerary')} className="text-xs text-primary hover:text-primary-hover font-medium transition-colors">
                + Add Stop
              </button>
            </div>
          </div>

          {/* Inclusions */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Inclusions</label>
            <div className="space-y-2">
              {form.inclusions.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateListItem('inclusions', i, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="e.g., Snacks, Water"
                  />
                  {form.inclusions.length > 1 && (
                    <button onClick={() => removeListItem('inclusions', i)} className="p-1 text-muted-foreground hover:text-danger transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem('inclusions')} className="text-xs text-primary hover:text-primary-hover font-medium transition-colors">
                + Add Inclusion
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || form.basePricePerPerson <= 0 || form.durationHours <= 0}
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingId ? 'Save Changes' : 'Create Template'}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Template Cards ────────────────────────────────────────── */}
      <div className="space-y-4">
        {filtered.map((template) => {
          const sCount = slotCount(template.id);
          const isDeleting = deleteConfirm === template.id;

          return (
            <div
              key={template.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-border-light transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xl font-bold text-foreground">${template.basePricePerPerson}</p>
                  <p className="text-xs text-muted-foreground">per person</p>
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> {template.durationHours} hrs
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> Min Age: {template.minAge}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {template.itinerary.length} stops
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="w-3.5 h-3.5" /> {sCount} slot{sCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Itinerary */}
              <div className="mb-3">
                <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wider">Itinerary</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.itinerary.map((stop, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-xs text-foreground">
                      <span className="text-muted font-mono">{i + 1}.</span> {stop}
                    </span>
                  ))}
                </div>
              </div>

              {/* Inclusions */}
              <div className="mb-4">
                <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wider">Inclusions</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.inclusions.map((item, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/10 text-xs text-success font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => openEdit(template)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>

                {isDeleting ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-danger font-medium">
                      {sCount > 0 ? `${sCount} slot(s) reference this template!` : 'Confirm delete?'}
                    </span>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-danger/10 text-danger rounded-md hover:bg-danger/20 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(template.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search ? 'No templates match your search.' : 'No templates yet. Create your first tour template!'}
          </div>
        )}
      </div>
    </div>
  );
}
