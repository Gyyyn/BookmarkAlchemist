// --- Theme Loader Script ---
(function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    } else {
    document.documentElement.classList.remove('dark');
    }
})();

const { useEffect, useMemo, useState, useRef, Fragment } = React;

const STORAGE_KEY = 'bookmark_manager_v1';
const THEME_KEY = 'theme';

const defaultData = {
    version: 1,
    folders: [{ id: 'root', name: 'All', emoji: '🗂️' }],
    bookmarks: []
};

// --- Data Persistence (Updated for chrome.storage) ---
const loadData = async () => {
    try {
    // The chrome.storage API is asynchronous
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const raw = result[STORAGE_KEY];
    
    if (!raw) return defaultData;
    // Data is already parsed from JSON by chrome.storage
    const parsed = raw;
    
    if (!parsed.version || !Array.isArray(parsed.folders) || !Array.isArray(parsed.bookmarks)) {
        return defaultData;
    }
    if (!parsed.folders.find(f => f.id === 'root')) {
        parsed.folders.unshift({ id: 'root', name: 'All', emoji: '🗂️' });
    }
    parsed.folders = parsed.folders.map(f => ({ emoji: '📁', ...f }));
    return parsed;
    } catch {
    return defaultData;
    }
};

const saveData = (data) => {
    // The key-value pair is structured like { 'key': value }
    chrome.storage.local.set({ [STORAGE_KEY]: data });
};

// --- Utility Functions ---
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const classNames = (...xs) => xs.filter(Boolean).join(' ');

function useDebouncedEffect(effect, deps, delay) {
    useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
    }, [...(deps || []), delay]);
}

function getFaviconUrl(url) {
    try {
    const u = new URL(url);
    return {
        primary: `${u.origin}/favicon.ico`,
        fallback: `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`
    };
    } catch {
    return { primary: '', fallback: '' };
    }
}

function prettyHostname(url) {
    try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
    } catch {
    return url;
    }
}

// --- UI Components ---

function DefaultButton({ children, className, ...props }) {
    return (
    <button
        className={classNames(
        "focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm transition active:scale-95 hover:shadow",
        "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700",
        "hover:border-slate-400",
        className
        )}
        {...props}
    >
        {children}
    </button>
    );
}

function PrimaryButton({ children, className, ...props }) {
    return (
    <button
        className={classNames(
        "focus-ring inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition active:scale-95 hover:bg-blue-700",
        "dark:bg-blue-600 dark:hover:bg-blue-500",
        className
        )}
        {...props}
    >
        {children}
    </button>
    );
}

function Chip({ children, active, onClick, title }) {
    return (
    <button
        title={title}
        onClick={onClick}
        className={classNames(
        "focus-ring rounded-full border px-3 py-1 text-xs font-medium transition",
        active
            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500"
            : "border-slate-300 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        )}
    >
        {children}
    </button>
    );
}

function Modal({ open, onClose, title, children, footer, isAnimating, onAnimationComplete }) {
    if (!open) return null;

    const handleAnimationEnd = () => {
    if (isAnimating && onAnimationComplete) {
        onAnimationComplete();
    }
    };

    return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" aria-modal="true" role="dialog">
        <div
        className={classNames(
            "w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-950 dark:border dark:border-gray-800",
            isAnimating ? 'animate-fly-out' : 'animate-pop'
        )}
        onAnimationEnd={handleAnimationEnd}
        >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="focus-ring rounded-full p-2 hover:bg-slate-100 active:scale-95 dark:hover:bg-gray-800">
            ✕
            </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-gray-800">{footer}</div>}
        </div>
    </div>
    );
}

function Dropdown({ trigger, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setIsOpen(o => !o)}>{trigger}</div>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-pop dark:bg-gray-900 dark:ring-gray-700" role="menu">
                    <div className="p-1" onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

function ThemeSwitcher({ theme, setTheme }) {
    const options = [
    { name: 'Light', value: 'light', icon: '☀️' },
    { name: 'Dark', value: 'dark', icon: '🌙' },
    { name: 'System', value: 'system', icon: '🖥️' }
    ];

    return (
    <div className="flex justify-center items-center rounded-lg border border-slate-300 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {options.map(opt => (
        <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.name}
            className={classNames(
            "focus-ring rounded-md px-2 py-1 text-sm transition-colors",
            theme === opt.value ? "bg-slate-100 dark:bg-gray-700" : "hover:bg-slate-100 dark:hover:bg-gray-700"
            )}
        >
            {opt.icon}
        </button>
        ))}
    </div>
    );
}

function BookmarkForm({ onAdd, folders }) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [folderId, setFolderId] = useState("root");
    const urlRef = useRef(null);

    useEffect(() => { urlRef.current?.focus(); }, []);

    function validateUrl(u) {
    try { new URL(u); return true; } catch { return false; }
    }

    function handleSubmit(e) {
    e.preventDefault();
    if (!validateUrl(url)) {
        console.error("Please enter a valid URL (include http/https).");
        return;
    }
    const normalizedTitle = title.trim() || prettyHostname(url);
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    onAdd({
        id: uid(),
        url: url.trim(),
        title: normalizedTitle,
        tags: tagsArr,
        folderId,
        createdAt: Date.now()
    });
    }

    return (
    <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-2">
        <label className="text-sm font-medium">URL</label>
        <input
            ref={urlRef}
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400"
            required
            inputMode="url"
        />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Optional (will use hostname)"
            className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400"
            />
        </div>
        <div className="grid gap-2">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="design, react, docs"
            className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400"
            />
        </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
            <label className="text-sm font-medium">Folder</label>
            <select
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
            {folders.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
            </select>
        </div>
        <div className="flex items-end justify-end gap-2">
            <PrimaryButton type="submit" className="mt-6">Add Bookmark</PrimaryButton>
        </div>
        </div>
    </form>
    );
}

function ManageFoldersModal({ open, onClose, folders, onAddFolder, onRenameFolder, onDeleteFolder }) {
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState("");
    const [newEmoji, setNewEmoji] = useState("📁");
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderEmoji, setNewFolderEmoji] = useState("📁");

    useEffect(() => {
    if (!open) {
        setEditingId(null);
        setNewName("");
        setNewEmoji("📁");
        setNewFolderName("");
        setNewFolderEmoji("📁");
    }
    }, [open]);

    const selectedFolder = folders.find(f => f.id === editingId);

    return (
    <Modal open={open} onClose={onClose} title="Manage Folders">
        <div className="grid gap-6">
        <div className="grid gap-2">
            <h3 className="font-semibold">Add New Folder</h3>
            <div className="flex gap-2">
            <input
                value={newFolderEmoji}
                onChange={e => setNewFolderEmoji(e.target.value)}
                className="focus-ring w-16 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm dark:bg-gray-800 dark:border-gray-700"
                maxLength="2"
            />
            <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="e.g. Design Resources"
                className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400"
            />
            <PrimaryButton onClick={() => {
                const n = newFolderName.trim();
                if (!n) return;
                onAddFolder(n, newFolderEmoji);
                setNewFolderName("");
                setNewFolderEmoji("📁");
            }}>Add</PrimaryButton>
            </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800"></div>
        <div className="grid gap-4">
            <h3 className="font-semibold">Edit Existing Folders</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Select a folder to rename or delete it. Bookmarks in a deleted folder will be moved to the main list.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto,1fr]">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Folder</label>
                <select
                value={editingId || ""}
                onChange={e => {
                    const id = e.target.value;
                    const folder = folders.find(f => f.id === id);
                    setEditingId(id || null);
                    setNewName(folder?.name || "");
                    setNewEmoji(folder?.emoji || "📁");
                }}
                className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                <option value="">Select a folder...</option>
                {folders.filter(f => f.id !== 'root').map(f => (
                    <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>
                ))}
                </select>
            </div>
            <div className="flex gap-2">
                <div className="grid gap-2">
                <label className="text-sm font-medium">Emoji</label>
                <input
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    disabled={!editingId}
                    className="focus-ring w-16 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700"
                    maxLength="2"
                />
                </div>
                <div className="grid gap-2 flex-grow">
                <label className="text-sm font-medium">New name</label>
                <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter new name"
                    disabled={!editingId}
                    className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400"
                />
                </div>
            </div>
            </div>
            <div className="flex justify-end gap-2">
            <DefaultButton
                disabled={!editingId || !newName.trim() || (newName.trim() === selectedFolder?.name && newEmoji === selectedFolder?.emoji)}
                onClick={() => {
                if (!editingId) return;
                const n = newName.trim();
                if (!n) return;
                onRenameFolder(editingId, n, newEmoji);
                setEditingId(null);
                setNewName("");
                setNewEmoji("📁");
                }}
            >
                Save Changes
            </DefaultButton>
            <DefaultButton
                className="text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:border-red-400/50 dark:hover:bg-red-900/20"
                disabled={!editingId}
                onClick={() => {
                if (!editingId) return;
                if (window.confirm(`Delete "${selectedFolder?.name}"? Bookmarks inside will move to the main list.`)) {
                    onDeleteFolder(editingId);
                    setEditingId(null);
                    setNewName("");
                    setNewEmoji("📁");
                }
                }}
            >
                Delete
            </DefaultButton>
            </div>
        </div>
        </div>
    </Modal>
    );
}

function Toolbar({ onAdd, onManageFolders, onExportJson, onImportJson, onExportHtml, onImportHtml, onClearAll, onOpenCommandPalette, theme, setTheme }) {
    const jsonFileRef = useRef(null);
    const htmlFileRef = useRef(null);

    function handleFileChange(e, importFn) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => importFn(event.target.result);
    reader.readAsText(file);
    e.target.value = "";
    }

    const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
    );

    return (
    <div className="flex flex-wrap items-center gap-2">
        {/* Moved file inputs here and added IDs */}
        <input id="import-json-file" ref={jsonFileRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleFileChange(e, onImportJson)} />
        <input id="import-html-file" ref={htmlFileRef} type="file" accept="text/html,.html" className="hidden" onChange={(e) => handleFileChange(e, onImportHtml)} />

        <DefaultButton onClick={onOpenCommandPalette} className="hidden sm:inline-flex">
        <span className="text-xs">CTRL+K / ⌘K</span>
        </DefaultButton>
        <div className="h-6 w-px bg-slate-200 dark:bg-gray-700 mx-2"></div>
        <PrimaryButton onClick={onAdd}>+ Add Bookmark</PrimaryButton>
        <DefaultButton onClick={onManageFolders}>Manage Folders</DefaultButton>
        <Dropdown trigger={
        <DefaultButton>
            <MenuIcon />
        </DefaultButton>
        }>
        <div className="">
            <ThemeSwitcher theme={theme} setTheme={setTheme} />

            <div className="border-t my-1 dark:border-gray-700"></div>

            <button onClick={onExportHtml} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" role="menuitem">Export HTML</button>
            <button onClick={() => htmlFileRef.current?.click()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" role="menuitem">Import HTML</button>

            <div className="border-t my-1 dark:border-gray-700"></div>

            <button onClick={onExportJson} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" role="menuitem">Export JSON</button>
            <button onClick={() => jsonFileRef.current?.click()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" role="menuitem">Import JSON</button>
            
            {/* Inputs removed from here */}
            
            <div className="border-t my-1 dark:border-gray-700"></div>
            <button onClick={onClearAll} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50" role="menuitem">Clear All</button>
        </div>
        </Dropdown>
    </div>
    );
}

function TagFilter({ tags, activeTags, toggleTag, clearTags }) {
    if (tags.length === 0) return null;
    return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:bg-gray-950 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by tags:</span>
        {activeTags.length > 0 && (
            <DefaultButton onClick={clearTags}>Clear Filters</DefaultButton>
        )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-gray-800">
        {tags.map(t => (
            <Chip key={t} active={activeTags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>
        ))}
        </div>
    </div>
    );
}

function BookmarkCard({ bm, onRemove, onMove, onEdit }) {
    const [imgSrc, setImgSrc] = useState(getFaviconUrl(bm.url).primary);
    const { fallback } = getFaviconUrl(bm.url);
    const host = prettyHostname(bm.url);
    const isBookmarklet = bm.url && bm.url.startsWith('javascript:');

    const commonLinkProps = {
    className: "focus-ring absolute inset-0 w-full",
    'aria-label': `${isBookmarklet ? 'Run' : 'Open'} ${bm.title}`
    };

    return (
    <div className="group flex flex-col justify-between h-full relative animate-pop overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow dark:bg-gray-950 dark:border-gray-800">
        {isBookmarklet ? (
        // Use a button for javascript: URLs (bookmarklets) to avoid React security warnings.
        <button {...commonLinkProps} onClick={() => { window.location.href = bm.url; }} />
        ) : (
        <a {...commonLinkProps} href={bm.url} target="_blank" rel="noreferrer" />
        )}
        
        <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-gray-700">
            {imgSrc ? (
            <img
                alt=""
                className="h-full w-full object-cover"
                src={imgSrc}
                onError={() => {
                if (imgSrc !== fallback && fallback) setImgSrc(fallback);
                }}
            />
            ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700"></div>
            )}
        </div>
        </div>

        <div className="items-center flex flex-wrap gap-1">
        <div className="mt-1 min-w-0">
            <div className="truncate text-sm font-semibold">{bm.title}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{host}</div>
        </div>
        {bm.tags.map(tag => (
            <span key={tag} className="mt-1 me-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-400">
            #{tag}
            </span>
        ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 translate-y-6 bg-gradient-to-t from-white to-transparent opacity-0 transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 dark:from-gray-950"></div>

        <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-xl bg-white/80 p-1 opacity-0 shadow backdrop-blur transition group-hover:opacity-100 dark:bg-gray-900/80">
        <button
            className="focus-ring rounded-lg p-2 text-xs hover:bg-slate-100 dark:hover:bg-gray-800"
            title="Edit"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(bm); }}
        >✎</button>
        <button
            className="focus-ring rounded-lg p-2 text-xs hover:bg-slate-100 dark:hover:bg-gray-800"
            title="Move"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMove(bm); }}
        >⇄</button>
        <button
            className="focus-ring rounded-lg p-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
            title="Remove"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(bm.id); }}
        >🗑</button>
        </div>
    </div>
    );
}

function FolderCard({ folder, onToggle, isExpanded, bookmarkCount }) {
    return (
    <div 
        className="group flex flex-col justify-between h-full relative animate-pop overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow dark:bg-gray-950 dark:border-gray-800"
        onClick={() => onToggle(folder.id)}
    >
        <button className="focus-ring absolute inset-0" aria-label={`Toggle folder ${folder.name}`}></button>
        <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 grid place-items-center rounded-xl ring-1 ring-slate-200 dark:ring-gray-700 bg-slate-100 dark:bg-gray-800 text-xl">
            {folder.emoji || '📁'}
        </div>
        </div>
        <div className="mt-3 min-w-0">
            <div className="truncate text-sm font-semibold">{folder.name}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{bookmarkCount} bookmarks</div>
        </div>
    </div>
    );
}

function EditBookmarkModal({ open, onClose, bookmark, onSave, folders }) {
    const [title, setTitle] = useState(bookmark?.title || "");
    const [tags, setTags] = useState(bookmark?.tags?.join(", ") || "");
    const firstRef = useRef(null);

    useEffect(() => {
    setTitle(bookmark?.title || "");
    setTags(bookmark?.tags?.join(", ") || "");
    }, [bookmark]);

    useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 50);
    }, [open]);

    if (!bookmark) return null;

    return (
    <Modal open={open} onClose={onClose} title="Edit Bookmark" footer={
        <>
        <DefaultButton onClick={onClose}>Cancel</DefaultButton>
        <PrimaryButton onClick={() => {
            onSave({ ...bookmark, title: title.trim() || prettyHostname(bookmark.url), tags: tags.split(",").map(t => t.trim()).filter(Boolean) });
            onClose();
        }}>Save</PrimaryButton>
        </>
    }>
        <div className="grid gap-3">
        <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <input ref={firstRef} className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                    value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-2">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <input className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                    value={tags} onChange={e => setTags(e.target.value)} />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">URL: {bookmark.url}</div>
        </div>
    </Modal>
    );
}

function MoveBookmarkModal({ open, onClose, bookmark, onMove, folders }) {
    const [folderId, setFolderId] = useState(bookmark?.folderId || 'root');
    useEffect(() => {
    setFolderId(bookmark?.folderId || 'root');
    }, [bookmark]);

    if (!bookmark) return null;

    return (
    <Modal open={open} onClose={onClose} title="Move Bookmark" footer={
        <>
        <DefaultButton onClick={onClose}>Cancel</DefaultButton>
        <PrimaryButton onClick={() => { onMove(bookmark.id, folderId); onClose(); }}>Move</PrimaryButton>
        </>
    }>
        <div className="grid gap-2">
        <label className="text-sm font-medium">Destination folder</label>
        <select className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                value={folderId} onChange={e => setFolderId(e.target.value)}>
            {folders.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
        </select>
        </div>
    </Modal>
    );
}

function Grid({ items, onRemove, onMove, onEdit, onToggleFolder, expandedFolders, bookmarksByFolder }) {
    return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item, idx) => {
        // It's a folder if it doesn't have a URL
        const isFolder = !item.url;
        if (isFolder) {
            const isExpanded = expandedFolders.includes(item.id);
            const folderBookmarks = bookmarksByFolder[item.id] || [];
            return (
            <Fragment key={item.id}>
                <div style={{ animationDelay: `${idx * 25}ms` }} className="col-span-2 sm:col-span-1">
                <div className="aspect-square">
                    <FolderCard 
                    folder={item} 
                    onToggle={onToggleFolder} 
                    isExpanded={isExpanded} 
                    bookmarkCount={folderBookmarks.length}
                    />
                </div>
                </div>
                {isExpanded && (
                <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 border-l-4 border-gray-200 dark:border-gray-800 mb-4">
                    {folderBookmarks.length > 0 ? folderBookmarks.map((bm, bmIdx) => (
                    <div key={bm.id} style={{ animationDelay: `${bmIdx * 25}ms` }}>
                        <div className="aspect-square">
                        <BookmarkCard bm={bm} onRemove={onRemove} onMove={onMove} onEdit={onEdit} />
                        </div>
                    </div>
                    )) : (
                    <div className="col-span-full text-center text-gray-500 py-4">This folder is empty.</div>
                    )}
                </div>
                )}
            </Fragment>
            );
        }

        // It's a bookmark
        return (
            <div key={item.id} style={{ animationDelay: `${idx * 25}ms` }}>
            <div className="aspect-square">
                <BookmarkCard bm={item} onRemove={onRemove} onMove={onMove} onEdit={onEdit} />
            </div>
            </div>
        );
        })}
    </div>
    );
}

function SortControl({ sortOrder, setSortOrder }) {
    const options = [
    { value: 'default', label: 'Default' },
    { value: 'az', label: 'A-Z' },
    { value: 'za', label: 'Z-A' }
    ];

    return (
    <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by</label>
        <select
        value={sortOrder}
        onChange={e => setSortOrder(e.target.value)}
        className="focus-ring rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
    );
}

// --- Command Palette Component ---
function CommandPalette({ open, onClose, commands }) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
    if (open) {
        // Reset state when opening
        setQuery("");
        setSelectedIndex(0);
        // Focus input after a short delay to ensure it's rendered
        setTimeout(() => inputRef.current?.focus(), 100);
    }
    }, [open]);

    const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.trim().toLowerCase();
    return commands.filter(cmd => cmd.name.toLowerCase().includes(q));
    }, [commands, query]);

    useEffect(() => {
    // Reset index if filtered commands change
    setSelectedIndex(0);
    }, [filteredCommands]);

    useEffect(() => {
    const handleKeyDown = (e) => {
        if (!open) return;
        if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
            command.action();
            onClose();
        }
        } else if (e.key === 'Escape') {
        onClose();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, filteredCommands, selectedIndex]);
    
    useEffect(() => {
    // Scroll the selected item into view
    if (listRef.current) {
        const selectedElement = listRef.current.children[selectedIndex];
        selectedElement?.scrollIntoView({ block: 'nearest' });
    }
    }, [selectedIndex]);

    if (!open) return null;

    return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/50 p-4 pt-[15vh]" onClick={onClose}>
        <div
        className="w-full max-w-lg animate-pop overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-950 dark:border dark:border-gray-800"
        onClick={e => e.stopPropagation()}
        >
        <div className="border-b border-slate-200 p-2 dark:border-gray-800">
            <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
        </div>
        <ul ref={listRef} className="max-h-[40vh] overflow-auto p-2">
            {filteredCommands.length > 0 ? filteredCommands.map((cmd, index) => (
            <li key={cmd.name}>
                <button
                onClick={() => { cmd.action(); onClose(); }}
                className={classNames(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    index === selectedIndex ? "bg-slate-100 dark:bg-gray-800" : "hover:bg-slate-100 dark:hover:bg-gray-800"
                )}
                >
                <span className="flex items-center gap-3">
                    <span>{cmd.icon}</span>
                    <span>{cmd.name}</span>
                </span>
                {cmd.shortcut && <span className="text-xs text-gray-500">{cmd.shortcut}</span>}
                </button>
            </li>
            )) : (
            <li className="p-4 text-center text-sm text-gray-500">No commands found.</li>
            )}
        </ul>
        </div>
    </div>
    );
}

// --- Main App Component ---
function App() {
    const [data, setData] = useState(null);
    const [query, setQuery] = useState("");
    const [activeTags, setActiveTags] = useState([]);
    const [editTarget, setEditTarget] = useState(null);
    const [moveTarget, setMoveTarget] = useState(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isAnimatingAdd, setIsAnimatingAdd] = useState(false);
    const [isManageFoldersModalOpen, setManageFoldersModalOpen] = useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState([]);
    const [sortOrder, setSortOrder] = useState('default');
    const pendingBookmark = useRef(null);
    const searchInputRef = useRef(null);
    
    const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'system');

    // Load initial data from chrome.storage
    useEffect(() => {
    loadData().then(initialData => {
        setData(initialData);
    });
    }, []);

    // --- Auto-focus search input on page load ---
    useEffect(() => {
    searchInputRef.current?.focus();
    }, []);

    // --- Command Palette Shortcut (Cmd+K) ---
    useEffect(() => {
    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(o => !o);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const setTheme = (newTheme) => {
    localStorage.setItem(THEME_KEY, newTheme);
    setThemeState(newTheme);
    };

    useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark';
    const isSystem = theme === 'system';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDark || (isSystem && systemPrefersDark)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
        if (theme === 'system') {
        if (e.matches) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useDebouncedEffect(() => saveData(data), [data], 150);

    const allTags = useMemo(() => {
        if (!data) {
            return [];
        }
        const set = new Set();
        data.bookmarks.forEach(b => b.tags?.forEach(t => set.add(t)));
        return Array.from(set).sort((a,b) => a.localeCompare(b));
    }, [data]);

    const { displayItems, bookmarksByFolder } = useMemo(() => {

    // Quick race catch.
    let filteredBookmarks = [];

    if (data) {
        filteredBookmarks = data.bookmarks.slice();
    }
    
    if (query.trim()) {
        const q = query.trim().toLowerCase();
        filteredBookmarks = filteredBookmarks.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
        );
    }
    if (activeTags.length) {
        filteredBookmarks = filteredBookmarks.filter(b => activeTags.every(t => b.tags.includes(t)));
    }

    const sortFn = (a, b) => {
        const aName = a.title || a.name;
        const bName = b.title || b.name;
        if (sortOrder === 'az') return aName.localeCompare(bName);
        if (sortOrder === 'za') return bName.localeCompare(aName);
        if (sortOrder === 'default' && a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
    };
    
    const sortedBookmarks = [...filteredBookmarks].sort(sortFn);

    const bookmarksByFolder = sortedBookmarks.reduce((acc, bm) => {
        const folderId = bm.folderId || 'root';
        if (!acc[folderId]) acc[folderId] = [];
        acc[folderId].push(bm);
        return acc;
    }, {});

        let sortedFolders = [];
        let rootBookmarks = [];

    if (data && data.folders) {
        sortedFolders = [...data.folders.filter(f => f.id !== 'root')].sort(sortFn);
        rootBookmarks = bookmarksByFolder['root'] || [];
    }
    
    const displayItems = [...sortedFolders, ...rootBookmarks];

    return { displayItems, bookmarksByFolder };
    }, [data, query, activeTags, sortOrder]);

    // If data is not loaded yet, show a loading state
    if (!data) {
        return <div className="text-center p-10">Loading bookmarks...</div>
    }

    function toggleFolder(folderId) {
    setExpandedFolders(prev => 
        prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
    }

    function completeAddBookmark() {
    if (!pendingBookmark.current) return;
    const b = pendingBookmark.current;
    setData(prev => ({ ...prev, bookmarks: [b, ...prev.bookmarks] }));
    pendingBookmark.current = null;
    setIsAnimatingAdd(false);
    setAddModalOpen(false);
    }

    function handleAddBookmark(bookmarkData) {
    pendingBookmark.current = bookmarkData;
    setIsAnimatingAdd(true);
    }

    function removeBookmark(id) {
    setData(prev => ({ ...prev, bookmarks: prev.bookmarks.filter(b => b.id !== id) }));
    }

    function addFolder(name, emoji) {
    const exists = data.folders.some(f => f.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    const f = { id: uid(), name, emoji };
    setData(prev => ({ ...prev, folders: [...prev.folders, f] }));
    }

    function renameFolder(id, name, emoji) {
    setData(prev => ({
        ...prev,
        folders: prev.folders.map(f => f.id === id ? { ...f, name, emoji } : f)
    }));
    }

    function deleteFolder(id) {
    setData(prev => {
        const folders = prev.folders.filter(f => f.id !== id);
        const bookmarks = prev.bookmarks.map(b => b.folderId === id ? { ...b, folderId: 'root' } : b);
        return { ...prev, folders, bookmarks };
    });
    setExpandedFolders(prev => prev.filter(fId => fId !== id));
    }

    function moveBookmark(id, folderId) {
    setData(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.map(b => b.id === id ? { ...b, folderId } : b)
    }));
    }

    function editBookmark(updated) {
    setData(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.map(b => b.id === updated.id ? updated : b)
    }));
    }

    function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.json";
    a.click();
    URL.revokeObjectURL(url);
    }

    function importJson(jsonString) {
    try {
        const json = JSON.parse(jsonString);
        if (!json || !Array.isArray(json.folders) || !Array.isArray(json.bookmarks)) {
            return;
        }
        const normalized = {
        version: 1,
        folders: json.folders.length ? json.folders : [{ id: 'root', name: 'All' }],
        bookmarks: json.bookmarks.map(b => ({
            id: b.id || uid(),
            url: b.url,
            title: b.title || prettyHostname(b.url),
            tags: Array.isArray(b.tags) ? b.tags : [],
            folderId: b.folderId || 'root',
            createdAt: b.createdAt || Date.now()
        }))
        };
        if (!normalized.folders.find(f => f.id === 'root')) {
        normalized.folders.unshift({ id: 'root', name: 'All' });
        }
        setData(normalized);
        setActiveTags([]);
        setQuery("");
    } catch (e) {
        console.error("Failed to parse JSON file", e);
    }
    }

    function exportHtml() {
    const bookmarksByFolder = data.bookmarks.reduce((acc, bm) => {
        const folderId = bm.folderId || 'root';
        if (!acc[folderId]) acc[folderId] = [];
        acc[folderId].push(bm);
        return acc;
    }, {});

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

    (bookmarksByFolder['root'] || []).forEach(bm => {
        html += `    <DT><A HREF="${bm.url}">${bm.title}</A>\n`;
    });

    data.folders.forEach(folder => {
        if (folder.id === 'root') return;
        html += `    <DT><H3>${folder.emoji} ${folder.name}</H3>\n`;
        html += `    <DL><p>\n`;
        (bookmarksByFolder[folder.id] || []).forEach(bm => {
        html += `        <DT><A HREF="${bm.url}">${bm.title}</A>\n`;
        });
        html += `    </DL><p>\n`;
    });

    html += `</DL><p>\n`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.html";
    a.click();
    URL.revokeObjectURL(url);
    }

    function importHtml(htmlString) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        
        const newFolders = [{ id: 'root', name: 'All' }];
        const newBookmarks = [];
        
        function parseList(dlElement, folderId) {
        for (const child of dlElement.children) {
            if (child.tagName !== 'DT') {
            continue;
            }
            const dt = child;
            const h3 = dt.querySelector('h3');
            const a = dt.querySelector('a');

            if (h3) {
            const folderName = h3.textContent.trim();
            const emojiMatch = folderName.match(/^(?:(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))/);
            const emoji = emojiMatch ? emojiMatch[0] : '📁';
            const name = folderName.replace(emoji, '').trim();

            const newFolder = { id: uid(), name, emoji };
            newFolders.push(newFolder);
            const nextDl = dt.nextElementSibling;
            const childDl = dt.querySelector('dl');

            if (childDl) {
                parseList(childDl, newFolder.id);
            } else if (nextDl && nextDl.tagName === 'DL') {
                parseList(nextDl, newFolder.id);
            }
            } else if (a) {
            newBookmarks.push({
                id: uid(),
                url: a.href,
                title: a.textContent.trim() || prettyHostname(a.href),
                tags: [],
                folderId: folderId,
                createdAt: Date.now()
            });
            }
        }
        }
        const firstDl = doc.querySelector('dl');
        if (firstDl) {
        parseList(firstDl, 'root');
        }
        setData({ version: 1, folders: newFolders, bookmarks: newBookmarks });
        setActiveTags([]);
        setQuery("");
    } catch (e) {
        console.error("Failed to parse HTML file", e);
    }
    }

    function clearAll() {
    if (window.confirm("This will clear all folders and bookmarks. Continue?")) {
        setData(defaultData);
    }
    }

    function toggleTag(tag) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    }

    const commands = [
    { name: 'Add Bookmark', icon: '➕', action: () => setAddModalOpen(true) },
    { name: 'Search', icon: '🔍', action: () => searchInputRef.current?.focus() },
    { name: 'Manage Folders', icon: '📁', action: () => setManageFoldersModalOpen(true) },
    { name: 'Import from JSON', icon: '📥', action: () => document.getElementById('import-json-file')?.click() },
    { name: 'Export to JSON', icon: '📤', action: exportJson },
    { name: 'Import from HTML', icon: '📥', action: () => document.getElementById('import-html-file')?.click() },
    { name: 'Export to HTML', icon: '📤', action: exportHtml },
    { name: 'Clear All Data', icon: '🗑️', action: clearAll },
    ];

    return (
    <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-2xl font-black tracking-tight dark:text-white">Bookmark Manager</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your personal, private, and portable bookmark collection.</p>
        </div>
        <Toolbar
            onAdd={() => setAddModalOpen(true)}
            onManageFolders={() => setManageFoldersModalOpen(true)}
            onExportJson={exportJson}
            onImportJson={importJson}
            onExportHtml={exportHtml}
            onImportHtml={importHtml}
            onClearAll={clearAll}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            theme={theme}
            setTheme={setTheme}
        />
        </header>

        <div className="mb-4 grid gap-4">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:bg-gray-950 dark:border-gray-800">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid gap-2 flex-grow">
                <label className="text-sm font-medium">Search</label>
                <input
                    ref={searchInputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search title, URL, tags... (⌘K for actions)"
                    className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400"
                />
                </div>
                <SortControl sortOrder={sortOrder} setSortOrder={setSortOrder} />
            </div>
            </div>
        <TagFilter
            tags={allTags}
            activeTags={activeTags}
            toggleTag={toggleTag}
            clearTags={() => setActiveTags([])}
        />
        </div>

        <main className="grid gap-4">
        {displayItems.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-gray-500 dark:bg-gray-950/60 dark:border-gray-800 dark:text-gray-400">
            No bookmarks found. Try clearing your search or adding a new link.
            </div>
        ) : (
            <Grid
            items={displayItems}
            onRemove={removeBookmark}
            onMove={(bm) => setMoveTarget(bm)}
            onEdit={(bm) => setEditTarget(bm)}
            onToggleFolder={toggleFolder}
            expandedFolders={expandedFolders}
            bookmarksByFolder={bookmarksByFolder}
            />
        )}
        </main>

        <Modal
        open={isAddModalOpen}
        onClose={() => {
            setAddModalOpen(false);
            setIsAnimatingAdd(false);
        }}
        title="Add New Bookmark"
        isAnimating={isAnimatingAdd}
        onAnimationComplete={completeAddBookmark}
        >
        <BookmarkForm onAdd={handleAddBookmark} folders={data.folders} />
        </Modal>

        <EditBookmarkModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        bookmark={editTarget}
        onSave={editBookmark}
        folders={data.folders}
        />
        <MoveBookmarkModal
        open={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        bookmark={moveTarget}
        onMove={moveBookmark}
        folders={data.folders}
        />
        <ManageFoldersModal
        open={isManageFoldersModalOpen}
        onClose={() => setManageFoldersModalOpen(false)}
        folders={data.folders}
        onAddFolder={addFolder}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        />
        <CommandPalette
        open={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
        />
    </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);