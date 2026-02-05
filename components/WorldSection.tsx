import React, { useState } from 'react';
import { Project, WorldBlock } from '../types';
import { Plus, Trash2, Edit3, X, Globe, Save } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};

const WorldSection: React.FC<Props> = ({ project, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    let updatedBlocks: WorldBlock[];
    if (editingId) {
      updatedBlocks = project.worldBlocks.map(b => 
        b.id === editingId ? { ...b, ...formData } : b
      );
    } else {
      updatedBlocks = [...project.worldBlocks, { id: generateId(), ...formData }];
    }

    onUpdate({ ...project, worldBlocks: updatedBlocks });
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: '', content: '' });
  };

  const finalizeDelete = () => {
    if (itemToDelete) {
      onUpdate({
        ...project,
        worldBlocks: project.worldBlocks.filter(b => b.id !== itemToDelete)
      });
      setItemToDelete(null);
    }
  };

  const handleEdit = (block: WorldBlock) => {
    setFormData({ title: block.title, content: block.content });
    setEditingId(block.id);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!itemToDelete}
        title="Удалить раздел?"
        message="Вы уверены, что хотите удалить эту часть описания мира?"
        onConfirm={finalizeDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Описание мира</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить блок</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {editingId ? 'Редактировать лор' : 'Новая запись в лоре'}
            </h3>
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ title: '', content: '' }); }} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Название раздела</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Магия, География, Боги..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Подробности</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 outline-none h-64 resize-none leading-relaxed transition-all"
                placeholder="Опишите все детали..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ title: '', content: '' }); }}
                className="px-8 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {project.worldBlocks.map((block) => (
          <div key={block.id} className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all overflow-hidden">
            <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                {block.title}
              </h3>
              <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleEdit(block)}
                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setItemToDelete(block.id)}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-8">
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {block.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {project.worldBlocks.length === 0 && !isAdding && (
        <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="bg-indigo-50 dark:bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-indigo-400 dark:text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Создайте свою вселенную</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Здесь можно хранить правила магии, историю народов или законы природы вашего мира.</p>
        </div>
      )}
    </div>
  );
};

export default WorldSection;