
import React, { useState } from 'react';
import { Project, Character } from '../types';
import { Plus, User, Trash2, Edit3, Image as ImageIcon, X, Eye } from 'lucide-react';
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

const CharacterSection: React.FC<Props> = ({ project, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '' });
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({ name: '', imageUrl: '', description: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    let updatedCharacters: Character[];
    if (editingId) {
      updatedCharacters = project.characters.map(c => 
        c.id === editingId ? { ...c, ...formData } : c
      );
    } else {
      updatedCharacters = [...project.characters, { id: generateId(), ...formData }];
    }

    onUpdate({ ...project, characters: updatedCharacters });
    resetForm();
  };

  const finalizeDelete = () => {
    if (itemToDelete) {
      onUpdate({
        ...project,
        characters: project.characters.filter(c => c.id !== itemToDelete)
      });
      setItemToDelete(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, char: Character) => {
    e.stopPropagation();
    setFormData({ name: char.name, imageUrl: char.imageUrl, description: char.description });
    setEditingId(char.id);
    setViewingCharacter(null);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!itemToDelete}
        title="Удалить анкету?"
        message="Вы уверены, что хотите удалить этого персонажа? Данные будут стерты навсегда."
        onConfirm={finalizeDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* View Modal */}
      {viewingCharacter && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Image Header */}
            <div className="w-full bg-slate-100 dark:bg-slate-900 relative h-64 md:h-80 shrink-0">
              {viewingCharacter.imageUrl ? (
                <img src={viewingCharacter.imageUrl} alt={viewingCharacter.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-24 h-24 text-slate-300 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => setViewingCharacter(null)}
                  className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content Body */}
            <div className="p-8 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{viewingCharacter.name}</h3>
              </div>
              
              <div className="flex-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Информация</h4>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">
                  {viewingCharacter.description || "Описание персонажа еще не добавлено."}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                <button
                  onClick={(e) => handleEdit(e, viewingCharacter)}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  Редактировать
                </button>
                <button
                  onClick={() => { setItemToDelete(viewingCharacter.id); setViewingCharacter(null); }}
                  className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  title="Удалить"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Персонажи</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить героя</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-8 animate-in zoom-in duration-200 overflow-y-auto max-h-[95vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {editingId ? 'Редактировать героя' : 'Новый персонаж'}
              </h3>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Имя персонажа</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Как его зовут?"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ссылка на портрет</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Прямая ссылка на изображение (jpg/png)</p>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Визуальный образ</label>
                <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[180px]">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                  ) : (
                    <div className="text-slate-300 dark:text-slate-700 flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-xs font-bold">Нет превью</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Биография и черты</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none h-40 resize-none leading-relaxed transition-all"
                  placeholder="Опишите характер, цели, секреты..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={resetForm}
                className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {project.characters.map((char) => (
          <div 
            key={char.id} 
            onClick={() => setViewingCharacter(char)}
            className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl dark:hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer flex flex-col h-full"
          >
            <div className="h-56 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
              {char.imageUrl ? (
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-slate-200 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => handleEdit(e, char)}
                  className="p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md transition-colors"
                  title="Редактировать"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setItemToDelete(char.id); }}
                  className="p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 shadow-md transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 flex justify-end">
                <span className="text-white/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Посмотреть
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{char.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4 flex-1">
                {char.description || 'Описание не добавлено'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {project.characters.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium">Главные герои пока прячутся в тени. Время их создать!</p>
        </div>
      )}
    </div>
  );
};

export default CharacterSection;
