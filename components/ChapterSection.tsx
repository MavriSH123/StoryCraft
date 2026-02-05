import React, { useState } from 'react';
import { Project, Chapter, Scene, SceneStatus } from '../types';
import { Plus, Trash2, Edit3, X, CheckCircle, Clock, ChevronDown, ChevronRight, User, GripVertical } from 'lucide-react';
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

const ChapterSection: React.FC<Props> = ({ project, onUpdate }) => {
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(new Set());
  const [deleteRequest, setDeleteRequest] = useState<{ id: string, type: 'chapter' | 'scene', parentId?: string } | null>(null);
  
  const [chapterForm, setChapterForm] = useState({ title: '', goalChars: 2000, currentChars: 0 });
  const [sceneForm, setSceneForm] = useState<{ chapterId: string | null; scene: Partial<Scene> | null }>({
    chapterId: null,
    scene: null
  });

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedChapterIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedChapterIds(next);
  };

  const handleSaveChapter = () => {
    if (!chapterForm.title.trim()) return;
    
    let updatedChapters: Chapter[];
    if (editingChapterId) {
      updatedChapters = project.chapters.map(c => 
        c.id === editingChapterId ? { ...c, ...chapterForm } : c
      );
    } else {
      updatedChapters = [...project.chapters, {
        id: generateId(),
        ...chapterForm,
        scenes: []
      }];
    }

    onUpdate({ ...project, chapters: updatedChapters });
    setIsAddingChapter(false);
    setEditingChapterId(null);
    setChapterForm({ title: '', goalChars: 2000, currentChars: 0 });
  };

  const finalizeDelete = () => {
    if (!deleteRequest) return;

    if (deleteRequest.type === 'chapter') {
      onUpdate({ ...project, chapters: project.chapters.filter(c => c.id !== deleteRequest.id) });
    } else if (deleteRequest.type === 'scene' && deleteRequest.parentId) {
      const updatedChapters = project.chapters.map(ch => {
        if (ch.id === deleteRequest.parentId) {
          return { ...ch, scenes: ch.scenes.filter(s => s.id !== deleteRequest.id) };
        }
        return ch;
      });
      onUpdate({ ...project, chapters: updatedChapters });
    }
    setDeleteRequest(null);
  };

  const handleSaveScene = () => {
    const { chapterId, scene } = sceneForm;
    if (!chapterId || !scene?.title?.trim()) return;

    const updatedChapters = project.chapters.map(ch => {
      if (ch.id === chapterId) {
        const scenes = scene.id 
          ? ch.scenes.map(s => s.id === scene.id ? { ...s, ...scene as Scene } : s)
          : [...ch.scenes, { 
              id: generateId(), 
              title: scene.title || '', 
              description: scene.description || '', 
              status: scene.status || SceneStatus.PLANNING, 
              characterIds: scene.characterIds || [] 
            } as Scene];
        return { ...ch, scenes };
      }
      return ch;
    });

    onUpdate({ ...project, chapters: updatedChapters });
    setSceneForm({ chapterId: null, scene: null });
  };

  const getStatusLabel = (status: SceneStatus) => {
    switch (status) {
      case SceneStatus.PLANNING: return { text: 'Планирование', color: 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400', icon: Clock };
      case SceneStatus.IN_PROGRESS: return { text: 'В процессе', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: Edit3 };
      case SceneStatus.DONE: return { text: 'Готово', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle };
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...project.chapters];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onUpdate({ ...project, chapters: items });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!deleteRequest}
        title={deleteRequest?.type === 'chapter' ? "Удалить главу?" : "Удалить сцену?"}
        message={deleteRequest?.type === 'chapter' ? "Это действие удалит всю главу и входящие в неё сцены навсегда." : "Вы уверены, что хотите удалить эту сцену?"}
        onConfirm={finalizeDelete}
        onCancel={() => setDeleteRequest(null)}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Планировщик глав</h2>
        <button
          onClick={() => setIsAddingChapter(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить главу</span>
        </button>
      </div>

      {(isAddingChapter || editingChapterId) && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">{editingChapterId ? 'Редактировать главу' : 'Новая глава'}</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Название</label>
                <input
                  type="text"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Глава 1: Новое начало"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Цель (знаков)</label>
                  <input
                    type="number"
                    value={chapterForm.goalChars}
                    onChange={(e) => setChapterForm({ ...chapterForm, goalChars: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Готово</label>
                  <input
                    type="number"
                    value={chapterForm.currentChars}
                    onChange={(e) => setChapterForm({ ...chapterForm, currentChars: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setIsAddingChapter(false); setEditingChapterId(null); }}
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >Отмена</button>
                <button
                  onClick={handleSaveChapter}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
                >Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sceneForm.chapterId && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">{sceneForm.scene?.id ? 'Редактировать сцену' : 'Новая сцена'}</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Название сцены</label>
                <input
                  type="text"
                  value={sceneForm.scene?.title || ''}
                  onChange={(e) => setSceneForm({ ...sceneForm, scene: { ...sceneForm.scene, title: e.target.value } })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Что происходит?</label>
                <textarea
                  value={sceneForm.scene?.description || ''}
                  onChange={(e) => setSceneForm({ ...sceneForm, scene: { ...sceneForm.scene, description: e.target.value } })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none h-28 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Статус</label>
                <select
                  value={sceneForm.scene?.status || SceneStatus.PLANNING}
                  onChange={(e) => setSceneForm({ ...sceneForm, scene: { ...sceneForm.scene, status: e.target.value as SceneStatus } })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none"
                >
                  <option value={SceneStatus.PLANNING}>Планирование</option>
                  <option value={SceneStatus.IN_PROGRESS}>В процессе</option>
                  <option value={SceneStatus.DONE}>Готово</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Персонажи в сцене</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
                  {project.characters.length === 0 && <span className="text-slate-400 text-xs py-1">Сначала добавьте персонажей в раздел "Персонажи"</span>}
                  {project.characters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        const current = sceneForm.scene?.characterIds || [];
                        const next = current.includes(char.id) ? current.filter(id => id !== char.id) : [...current, char.id];
                        setSceneForm({ ...sceneForm, scene: { ...sceneForm.scene, characterIds: next } });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        sceneForm.scene?.characterIds?.includes(char.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                      }`}
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setSceneForm({ chapterId: null, scene: null })}
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >Отмена</button>
                <button
                  onClick={handleSaveScene}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {project.chapters.map((chapter, index) => (
          <div 
            key={chapter.id} 
            draggable 
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all ${draggedIndex === index ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}
          >
            <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => toggleExpand(chapter.id)}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div 
                  className="p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <GripVertical className="w-5 h-5" />
                </div>
                {expandedChapterIds.has(chapter.id) ? <ChevronDown className="w-5 h-5 text-indigo-500" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{chapter.title}</h3>
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full tracking-wider">
                      {chapter.currentChars} / {chapter.goalChars || 1}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${chapter.currentChars >= (chapter.goalChars || 1) ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, (chapter.currentChars / (chapter.goalChars || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setChapterForm({ title: chapter.title, goalChars: chapter.goalChars, currentChars: chapter.currentChars }); 
                    setEditingChapterId(chapter.id); 
                  }} 
                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setDeleteRequest({ id: chapter.id, type: 'chapter' }); 
                  }} 
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedChapterIds.has(chapter.id) && (
              <div className="border-t border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/10 p-5 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Сцены</h4>
                  <button onClick={() => setSceneForm({ chapterId: chapter.id, scene: { title: '', status: SceneStatus.PLANNING, characterIds: [] } })} className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors">
                    <Plus className="w-3 h-3" /> Добавить сцену
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {chapter.scenes.length === 0 && <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm italic bg-white/50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">Пока здесь тихо...</div>}
                  {chapter.scenes.map(scene => {
                    const status = getStatusLabel(scene.status);
                    const StatusIcon = status.icon;
                    return (
                      <div key={scene.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${status.color}`}>
                                <StatusIcon className="w-3 h-3" /> {status.text}
                              </span>
                              <h5 className="font-black text-slate-800 dark:text-slate-200 truncate">{scene.title}</h5>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{scene.description}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-all ml-4">
                            <button onClick={() => setSceneForm({ chapterId: chapter.id, scene })} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteRequest({ id: scene.id, type: 'scene', parentId: chapter.id })} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {scene.characterIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-50 dark:border-slate-700">
                            {scene.characterIds.map(charId => {
                              const char = project.characters.find(c => c.id === charId);
                              return char ? (
                                <span key={charId} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-800">
                                  <User className="w-3 h-3" /> {char.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterSection;