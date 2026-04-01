
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Book, Users, Globe, ChevronLeft, Trash2, Edit3, Save, Search, BookOpen, Download, Upload, X, Sun, Moon } from 'lucide-react';
import { Project, Character, Chapter, WorldBlock, Scene, SceneStatus } from './types';
import CharacterSection from './components/CharacterSection';
import ChapterSection from './components/ChapterSection';
import WorldSection from './components/WorldSection';
import ConfirmModal from './components/ConfirmModal';
import { generateId } from './utils/generateId';

const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Scroll */}
    <path d="M20 70C20 60 30 60 30 70V85C30 95 20 95 20 85V70Z" fill="#D2B48C" stroke="#8B4513" strokeWidth="1"/>
    <path d="M30 70H85C90 70 95 75 95 80C95 85 90 90 85 90H30V70Z" fill="#EADBC8" stroke="#8B4513" strokeWidth="1"/>
    <circle cx="35" cy="80" r="6" fill="#FF0000" className="animate-pulse" />
    <circle cx="35" cy="80" r="4" fill="#B22222" />
    {/* Quill */}
    <path d="M80 10C75 10 40 40 25 85L20 95L30 90C75 75 85 15 80 10Z" fill="#5D2E2E" stroke="#3D1E1E" strokeWidth="1"/>
    <path d="M28 80C35 70 60 35 78 15" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M22 92L28 88" stroke="#3D1E1E" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'world'>('chapters');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('storycraft_theme') === 'dark';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('storycraft_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setProjects(parsed);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('storycraft_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('storycraft_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('storycraft_theme', 'light');
    }
  }, [isDarkMode]);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '' });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectForm({ title: project.title, description: project.description });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectForm.title.trim()) return;

    if (editingProject) {
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? { ...p, title: projectForm.title, description: projectForm.description, updatedAt: Date.now() } 
          : p
      ));
    } else {
      const project: Project = {
        id: generateId(),
        title: projectForm.title,
        description: projectForm.description,
        characters: [],
        chapters: [],
        worldBlocks: [],
        updatedAt: Date.now()
      };
      setProjects(prev => [project, ...prev]);
    }

    setIsProjectModalOpen(false);
    setProjectForm({ title: '', description: '' });
    setEditingProject(null);
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? { ...updatedProject, updatedAt: Date.now() } : p));
  };

  const finalizeDeleteProject = () => {
    if (projectToDelete) {
      setProjects(prev => prev.filter(p => p.id !== projectToDelete));
      if (currentProjectId === projectToDelete) setCurrentProjectId(null);
      setProjectToDelete(null);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storycraft_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        // Validate imported data structure
        if (!Array.isArray(imported)) {
          throw new Error('Файл должен содержать массив проектов');
        }
        
        // Validate each project has required fields
        const validProjects = imported.filter((project: any) => {
          return project && 
                 typeof project.id === 'string' && 
                 typeof project.title === 'string' &&
                 Array.isArray(project.characters) &&
                 Array.isArray(project.chapters) &&
                 Array.isArray(project.worldBlocks);
        });
        
        if (validProjects.length === 0) {
          throw new Error('Файл не содержит корректных проектов');
        }
        
        if (validProjects.length < imported.length) {
          console.warn(`Пропущено ${imported.length - validProjects.length} некорректных проектов`);
        }
        
        setProjects(validProjects);
      } catch (err) {
        console.error('Import error:', err);
        alert('Ошибка при чтении JSON файла. Убедитесь, что файл имеет правильный формат.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const ThemeToggle = () => (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
      title={isDarkMode ? "Светлая тема" : "Темная тема"}
    >
      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );

  if (currentProjectId && currentProject) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentProjectId(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
                <div className="flex items-center gap-2 truncate">
                  <Logo className="w-5 h-5 hidden md:block" />
                  <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-md">
                    {currentProject.title}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <nav className="flex space-x-0.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md">
                  <button
                    onClick={() => setActiveTab('chapters')}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                      activeTab === 'chapters' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Book className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Главы</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('characters')}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                      activeTab === 'characters' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Персонажи</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('world')}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                      activeTab === 'world' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Мир</span>
                  </button>
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-4">
          {activeTab === 'characters' && <CharacterSection project={currentProject} onUpdate={updateProject} />}
          {activeTab === 'chapters' && <ChapterSection project={currentProject} onUpdate={updateProject} />}
          {activeTab === 'world' && <WorldSection project={currentProject} onUpdate={updateProject} />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 px-3 sm:px-4 lg:px-6 transition-colors duration-300">
      <ConfirmModal 
        isOpen={!!projectToDelete}
        title="Удалить проект?"
        message="Вы уверены, что хотите навсегда удалить этот проект? Это действие невозможно отменить."
        onConfirm={finalizeDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-serif">
                StoryCraft
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Ваше рабочее пространство для творчества.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Импорт</span>
            </button>
            <button
              onClick={handleExport}
              disabled={projects.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Экспорт</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Создать</span>
            </button>
          </div>
        </div>

        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-5 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingProject ? 'Редактировать проект' : 'Новый проект'}
                </h2>
                <button onClick={() => setIsProjectModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Название</label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Название вашей истории"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Описание</label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none h-28 resize-none transition-all"
                    placeholder="Кратко расскажите, о чем она..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsProjectModalOpen(false)}
                    className="flex-1 py-2 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveProject}
                    className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {editingProject ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="bg-indigo-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Logo className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Пустота — это начало</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm mx-auto">Создайте свой первый проект или импортируйте существующий JSON бэкап.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => setCurrentProjectId(project.id)}
                className="group relative bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer flex flex-col h-full overflow-hidden"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Logo className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 leading-relaxed">
                    {project.description || 'Нет описания'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{project.characters.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Book className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{project.chapters.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditModal(e, project)}
                      className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-md transition-all"
                      title="Редактировать проект"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                      className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition-all"
                      title="Удалить проект"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
