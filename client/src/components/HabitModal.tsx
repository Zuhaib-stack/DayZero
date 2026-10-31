import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Flame } from 'lucide-react';
import { Habit } from '../types/index.js';
import { HABIT_ICONS, COLOR_OPTIONS, CATEGORY_OPTIONS, getHabitIcon } from '../utils/icons.js';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitData: any) => Promise<void>;
  initialData?: Habit | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#8b5cf6');
  const [targetDays, setTargetDays] = useState<number>(0);
  const [reminderTime, setReminderTime] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Fitness');
      setIcon(initialData.icon || 'Flame');
      setColor(initialData.color || '#8b5cf6');
      setTargetDays(initialData.target_days || 0);
      setReminderTime(initialData.reminder_time || '');
      setChecklistItems(initialData.checklist ? initialData.checklist.map(c => c.title) : []);
    } else {
      setName('');
      setDescription('');
      setCategory('Fitness');
      setIcon('Flame');
      setColor('#8b5cf6');
      setTargetDays(0);
      setReminderTime('');
      setChecklistItems([]);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (newChecklistText.trim()) {
      setChecklistItems([...checklistItems, newChecklistText.trim()]);
      setNewChecklistText('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        color,
        target_days: targetDays,
        reminder_time: reminderTime || null,
        checklist_items: checklistItems
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save habit');
    } finally {
      setLoading(false);
    }
  };

  const durationOptions = [
    { label: 'Unlimited', value: 0 },
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
    { label: '100 Days', value: 100 },
    { label: '365 Days', value: 365 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? 'Edit Habit' : 'Forge New Habit'}
              </h2>
              <p className="text-xs text-gray-400">
                {initialData ? 'Update habit parameters' : 'Day 1 of your journey starts today.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-lighter transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Habit Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gym Workout, Read 20 Pages, LeetCode, Meditation"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Why does this habit matter to you? What is the standard?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Category & Reminder Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Daily Reminder Time (Optional)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Target Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Target Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {durationOptions.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setTargetDays(opt.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium text-center border transition-all ${
                    targetDays === opt.value
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                      : 'bg-surface-lighter border-surface-border text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Card Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map(c => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${c.bg} ${
                    color === c.value ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c.value && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              {Object.keys(HABIT_ICONS).map(iconName => {
                const IconComponent = HABIT_ICONS[iconName];
                const isSelected = icon === iconName;
                return (
                  <button
                    type="button"
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-surface-lighter border-surface-border text-gray-400 hover:text-white hover:bg-surface-hover'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Checklist Builder */}
          <div className="pt-2 border-t border-surface-border">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Daily Checklist Subtasks (Optional)
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              All checklist tasks must be completed before the main day checkpoint unlocks!
            </p>

            {/* Existing Checklist Items */}
            {checklistItems.length > 0 && (
              <div className="space-y-2 mb-3">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-lighter border border-surface-border text-xs text-gray-200"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(index)}
                      className="text-gray-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add checklist input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. Wake at 6 AM, Drink 500ml water..."
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-surface-lighter border border-surface-border text-white text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-lighter/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Start Journey (Day 1)'}
          </button>
        </div>
      </div>
    </div>
  );
};

